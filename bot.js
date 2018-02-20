//////////////////// Init bot ////////////////////

require("dotenv").config();
const fs = require("fs");
const Discord = require("discord.js");
const GoogleSpreadsheet = require('google-spreadsheet');
const config = require("./config.js");

const bot = new Discord.Client();

//////////////////// Database /////////////////////

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
let warnings = null;
let db = null;

async function connectToDb() {
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || config.DATABASE_NAME;
  const MONGODB_URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${MONGODB_DB_NAME}`;
  db = await MongoClient.connect(MONGODB_URI);
  warnings = db.collection("warnings");
}

//////////////////// Auth /////////////////////////

const credentials = Object.assign(require('./google-auth.json'), {
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY
});

if (process.env.NODE_ENV !== "production") {
  credentials["private_key"] = fs.readFileSync("./secrets/google_private_key", "utf8");
}

const bossCarrySheet = new GoogleSpreadsheet(config.BOSS_CARRY_SHEET_ID);

//////////////////// Channels /////////////////////

let welcomeChannel;
let goodbyeChannel;
let testChannel;

//////////////////// Generic helpers //////////////

function rowToObject(row, mapping) {
  const keys = Object.keys(mapping);
  const result = {};
  for (const key of keys) {
    result[key] = row[mapping[key]];
  }
  return result;
}

function isAdmin(user) {
  return user.roles.find("name", "Fafnir") || user.roles.find("name", "Discord Admin");
}

//////////////////// Logging /////////////////////

function log(user, action, time = new Date()) {
  console.log(`${user.username}: ${action} @ ${time.toString()}`);
}

//////////////////// Boss carries ////////////////

function getBossCaryRows(rawRows, limit) {
  const rows = rawRows.map(row => {
    const obj = rowToObject(row, config.BOSS_CARRY_CARRIES_MAP);
    obj.date = new Date(obj.date);
    return obj;
  });
  return limit ? rows.slice(0, limit) : rows;
}

function getBossesNeeded(row) {
  return row.bossesNeeded;
}

function showBossCarriesByName(msg, limit) {
  bossCarrySheet.useServiceAccountAuth(credentials, (err) => {
    bossCarrySheet.getRows(1, (err, rawRows) => {
      const rows = getBossCaryRows(rawRows, limit);
      const carryListEmbed = new Discord.RichEmbed().setColor(3447003);
      rows.filter(row => row.bossesNeeded)
        .forEach(row => carryListEmbed.addField(row.name, getBossesNeeded(row)));
      msg.reply("here is the list of carries still needed:");
      msg.channel.send(carryListEmbed);
    });
  });
}

function showBossCarriesByBoss(msg, bosses) {
  bossCarrySheet.useServiceAccountAuth(credentials, (err) => {
    bossCarrySheet.getRows(1, (err, rawRows) => {
      const result = {};

      // check if limit was included
      const limit = Number(bosses[bosses.length - 1]) || null;
      if (limit) bosses = bosses.slice(0, bosses.length - 1);
      bosses.forEach(boss => result[boss] = []);

      // search for matching rows
      const rows = getBossCaryRows(rawRows, limit);
      rows.forEach(row => {
        const bossesNeeded = row.bossesNeeded.split(",").map(s => s.toLowerCase().trim());
        bosses.forEach(boss => {
          const match = bossesNeeded.filter(s => s.indexOf(boss) !== -1)[0];
          if (match) {
            const extraInfo = match.substring(match.indexOf(boss) + boss.length + 1).trim();
            result[boss].push(`${row.name} ${extraInfo}`);
          }
        });
      });

      // create embed
      const carryListEmbed = new Discord.RichEmbed().setColor(3447003);
      Object.keys(result).forEach(boss => {
        const carriesNeeded = result[boss].join(", ") || "No carries needed!";
        carryListEmbed.addField(boss, carriesNeeded);
      });

      // figure out reply
      const bossPluralStr = bosses.length > 1 ? "each of those bosses" : "that boss";
      if (limit) {
        if (limit === 1) msg.reply(`here is the next person to be carried for ${bossPluralStr}:`);
        else msg.reply(`here are the next ${limit} people to be carried for ${bossPluralStr}:`);
      } else {
        msg.reply(`here is the list of carries still needed for ${bossPluralStr}:`);
      }
      msg.channel.send(carryListEmbed);
    });
  });
}

// Assumes spreadsheet ordering is priority (does not sort by date)
function showBossCarryList(msg) {
  const tokens = msg.content.substring(msg.content.indexOf(" ") + 1).split(" ").slice(1);
  if (tokens[0] === "help") {
    msg.reply(`usage: ${config.COMMAND_PREFIX}carry list <boss name> | <number to show> | help`)
  } else if (tokens[0] && !Number(tokens[0])) {
    showBossCarriesByBoss(msg, tokens)
  } else {
    showBossCarriesByName(msg, Number(tokens[0]))
  }
}

function showBossNameList(msg) {
  let bossNamesList = "```\n";
  Object.keys(config.BOSS_CARRY_BOSS_NAMES).forEach(boss => {
    bossNamesList += `- ${boss} (${config.BOSS_CARRY_BOSS_NAMES[boss]})\n`;
  });
  bossNamesList += "```";
  msg.channel.send(
    "The current supported boss names are (case insensitive):\n" +
    `${bossNamesList}\n` +
    "**Make sure you use these names when entering your information in the spreadsheet!**"
  );
}

function showBossSpreadsheet(msg) {
  msg.reply(`the boss carry spreadsheet can be found at:\n${config.BOSS_CARRY_SHEET_URL}`);
}

//////////////////// Commands ////////////////////

function test(msg) {
  const whichTest = msg.content.substr(msg.content.indexOf(" ") + 1).split(" ")[0];
  if (whichTest === "welcome") {
    welcome(msg.author);
  } else if (whichTest === "goodbye") {
    goodbye(msg.author);
  }
}

function handleBossCarries(msg) {
  const tokens = msg.content.substring(msg.content.indexOf(" ") + 1).split(" ");
  const command = tokens[0];
  if (!command || command === "help") {
    msg.reply(`usage: ${config.COMMAND_PREFIX}carry list | bossnames | sheet | help`)
  } else if (command === "list") {
    showBossCarryList(msg);
  } else if (command === "bossnames") {
    showBossNameList(msg);
  } else if (command === "sheet") {
    showBossSpreadsheet(msg);
  }
}

//////////////////// Warning system //////////////

function warn(msg) {
  const tokens = msg.content.substring(msg.content.indexOf(" ") + 1).split(" ").slice(1);
  if (tokens.length === 0) return msg.reply("Please specify a user to warn.");
  const user = tokens[0];
  msg.channel.send(`User to warn: ${user}`);
}

//////////////////// Chat management /////////////

async function purge(msg) {
  const limit = Number(msg.content.substring(msg.content.indexOf(" ") + 1).split(" ")[0]) + 1;
  if (!limit) return msg.reply("Please specify the number of messages to purge.");
  if (isAdmin(msg.member)) {
    const messages = await msg.channel.fetchMessages({ limit });
    msg.channel.bulkDelete(messages);
    log(msg.author, config.LOGGING.PURGE);
  }
}

//////////////////// Handlers ////////////////////

function ready() {
  bot.user.setActivity(config.ACTIVITY_MESSAGE);
  welcomeChannel = bot.channels.get(config.WELCOME_CHANNEL_ID);
  goodbyeChannel = bot.channels.get(config.GOODBYE_CHANNEL_ID);
  testChannel = bot.channels.get(config.TEST_CHANNEL_ID);
  console.log(`Logged in as ${bot.user.tag}!`);
}

// TODO: Figure out better way to handle test commands
function handleCommand(msg) {
  const command = msg.content.substring(config.COMMAND_PREFIX.length).split(" ")[0];
  if (command === "test") {
    test(msg);
  } else if (command === "ping") {
    msg.reply(`pong! I am currently up and running in ${process.env.NODE_ENV} mode.`);
  } else if (command === "carry") {
    handleBossCarries(msg);
  } else if (command === "warn") {
    warn(msg);
  } else if (command === "purge") {
    purge(msg);
  }
}

function handleMessage(msg) {
  if (msg.content.startsWith(config.COMMAND_PREFIX)) {
    handleCommand(msg);
  }
}

function welcome(member) {
  const welcomeEmbed = new Discord.RichEmbed()
    .setColor(2215814)
    .addField("Welcome to Fafnir!", config.WELCOME_MESSAGE)
    .setImage(config.BG_IMG_URL);
  welcomeChannel.send(`Hi ${member}!`);
  welcomeChannel.send(welcomeEmbed);
}

function getRandomGoodbye() {
  return config.GOODBYE_MESSAGES[Math.floor(Math.random() * config.GOODBYE_MESSAGES.length)];
}

function goodbye(member) {
  const staticUserInfo = `${member.username}#${member.discriminator}`;
  goodbyeChannel.send(`${staticUserInfo} (${member}) has left the server. ${getRandomGoodbye()}`);
}

//////////////////// Run bot ////////////////////

async function main() {
  await connectToDb();
  bot.on("ready", ready);
  bot.on("message", handleMessage);
  bot.on("guildMemberAdd", welcome);
  bot.on("guildMemberRemove", goodbye);
  bot.login(process.env.DISCORD_TOKEN);
}

main();
