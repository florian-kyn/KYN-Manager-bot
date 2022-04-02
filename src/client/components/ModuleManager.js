//ModuleManager.js// -- Created By Florian Lepage 04/02/2022

const { MessageEmbed } = require("discord.js");

class ModuleManager{
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }

    error(interaction, message) {
        interaction.reply(
            {
                ephemeral: true,
                embeds: [
                    new MessageEmbed()
                        .setAuthor({name: this.client.user.username, iconURL: this.client.user.avatarURL()})
                        .setDescription(message)
                        .setTimestamp()
                        .setColor("#FF0000")
                        .setFooter({text: interaction.guild.name, iconURL: interaction.guild.iconURL()})
                ]
            }
        )
    }
}

module.exports = {
    ModuleManager
}