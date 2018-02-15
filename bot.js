//////////////////// Init dependencies ////////////////////

require("dotenv").config();

//////////////////// Init bot ////////////////////

const config = require("./config.js");
const Discord = require("discord.js");
const bot = new Discord.Client();

//////////////////// Channels ////////////////////

let welcomeChannel;
let goodbyeChannel;
let testChannel;

//////////////////// Commands ////////////////////

function test(msg) {
  const whichTest = msg.content.substr(msg.content.indexOf(" ") + 1).split(" ")[0];
  if (whichTest === "welcome") {
    welcome(msg.author);
  } else if (whichTest === "goodbye") {
    goodbye(msg.author);
  }
}

//////////////////// Handlers ////////////////////

function ready() {
  console.log(`Logged in as ${bot.user.tag}!`);
  welcomeChannel = bot.channels.get(config.WELCOME_CHANNEL_ID);
  goodbyeChannel = bot.channels.get(config.GOODBYE_CHANNEL_ID);
  testChannel = bot.channels.get(config.TEST_CHANNEL_ID);
}

// TODO: Figure out better way to handle test commands
function handleCommand(msg) {
  const command = msg.content.substring(config.COMMAND_PREFIX.length).split(" ")[0];
  if (command === "test") {
    test(msg);
  } else if (command === "ping") {
    msg.reply(`${msg.author} pong! I am currently up and running.`);
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

function goodbye(member) {
  goodbyeChannel.send(`${member} has left the server, cya nerd :^)`);
}

//////////////////// Register handlers ////////////////////

bot.on("ready", ready);
bot.on("message", handleMessage);
bot.on("guildMemberAdd", welcome);
bot.on("guildMemberRemove", goodbye);

bot.login(process.env.DISCORD_TOKEN);
