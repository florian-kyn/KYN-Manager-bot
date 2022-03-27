//RevenueManager.js// -- Created By Florian Lepage 01/17/2022

class RevenuesManager {
    constructor(config=null, interaction=null, client=null) {
        this.interaction = interaction;
        this.client = client;
        this.prefix = config.discord.prefix;
        this.config = config;
    }

    load() {
        let commands = [
            {
                name: "revenue-add",
                description: "Add a new revenue"
            },
            {
                name: "revenue-del",
                description: "Delete an existing revenue"
            },
            {
                name: "revenue-list",
                description: "Display a list of revenue"
            }
        ];
        return commands;
    }

    selector() {
        if(this.interaction.isCommand()) {
            console.log(this.interaction.command.name)
        }
    }
}



let message = [];

module.exports = {
    RevenuesManager
}

