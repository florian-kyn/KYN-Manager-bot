//index.js// -- Created By FLorian Lepage 01/17/2022

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const config = require("./config/config.json");

//Libs imports
const { RevenuesManager } =  require("./components/RevenuesManager.js");
const { CommandsLoader } = require("./components/CommandsLoader.js");
const { SQLTablesManager } = require("./components/SQLTablesManager.js");
const { Database } = require("./database/Database.js");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    new Database(config).checkConnectionState();
    new CommandsLoader(client).loadCommands();
    new SQLTablesManager(config).loadTables();
});

client.on(`interactionCreate`, (interaction) => {
    new RevenuesManager(config, interaction, client).selector();
});

client.login(config.discord.token);