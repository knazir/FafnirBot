module.exports = {
  // database
  DATABASE_NAME: "bot-db",

  // commands
  COMMAND_PREFIX: "!",
  OPTION_PREFIX: "--",

  // logging
  LOGGING: {
    PURGE: "purge",
    WARN: "warn"
  },

  // media
  BG_IMG_URL: "https://i.imgur.com/dL7979f.png",

  // warnings
  MAX_WARNINGS: 3,

  // roles

  // channels
  WELCOME_CHANNEL_ID: "398691402139172864",
  GOODBYE_CHANNEL_ID: "413609953077624832",
  TEST_CHANNEL_ID: "413615322705166338",

  // welcome and goodbye
  WELCOME_MESSAGE: "Please tag one of the online Fafnir members or Eagle and tell us your IGN. " +
  "**Failure to complete this instruction will result in a kick from the server!**",
  GOODBYE_MESSAGES: ["Cya nerd. :^)", "Later loser.", "Don't let the door hit you on the way out!", "Bye."],

  // boss carries
  BOSS_CARRY_SHEET_URL: "https://docs.google.com/spreadsheets/d/1BaPXOM--nfYaWj1pyfQR2fqH72hC3ICEGlq84Rp2LTQ/edit#gid=0",
  BOSS_CARRY_SHEET_ID: "1BaPXOM--nfYaWj1pyfQR2fqH72hC3ICEGlq84Rp2LTQ",
  BOSS_CARRY_CARRIES_MAP: {
    name: "name",
    bossesNeeded: "bossneeded",
    date: "date"
  },
  BOSS_CARRY_CARRIERS_MAP: {
    carrier: "carrier",
    soloBosses: "solobosses",
    partyBosses: "partybosses"
  },
  BOSS_CARRY_BOSS_NAMES: {
    cqueen: "Chaos Queen",
    cpierre: "Chaos Pierre",
    cvonbon: "Chaos Von Bon",
    cvel: "Chaos Vellum",
    hmag: "Hard Magnus",
    hellux: "Hell Gollux",
    hhilla: "Hard Hilla"
  },

  // misc
  STATUS: "online",
  ACTIVITY_MESSAGE: "Fafnir #1",
  USER_ID_REGEX: /<@[^>]+>/
};
