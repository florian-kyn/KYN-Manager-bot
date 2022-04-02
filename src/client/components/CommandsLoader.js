//CommandsLoader.js// -- Created By Florian Lepage 04/02/2022

// import modules
const { RevenuesManager } = require("./RevenuesManager");

class CommandsLoader{
    constructor(client) {
        this.client = client;
    }

    loadCommands() {
        let guild = this.client.guilds.cache.get("437634186828972033");

        let modules = [
            new RevenuesManager().loadCommands()
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
    }
}

module.exports = {
    CommandsLoader
}