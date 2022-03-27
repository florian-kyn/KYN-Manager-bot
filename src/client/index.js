//index.js// -- Created By FLorian Lepage 01/17/2022

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const config = require("./config/config.json");

//Libs imports
const { RevenuesManager } =  require("./components/RevenuesManager.js");
const { Database } = require("./database/Database.js");



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    new Database(config).checkConnectionState();

    let guildId = "437634186828972033";
    let guild = client.guilds.cache.get(guildId);

    let modules = [
        new RevenuesManager(config).load()
    ]

    if(guild) {
        for(const e of modules) {
            for(const i of e) {
                guild.commands.create(
                    i
                ).then().catch(console.error);
            }
        }
    }
});

client.on(`interactionCreate`, (interaction) => {
    new RevenuesManager(config, interaction, client).selector();
});

client.login(config.discord.token);