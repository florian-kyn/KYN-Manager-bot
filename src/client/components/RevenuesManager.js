//RevenueManager.js// -- Created By Florian Lepage 01/17/2022

const { ModuleManager } = require("./ModuleManager.js");
const { MessageEmbed } = require("discord.js");
const { Database } = require("../database/Database.js");

class RevenuesManager {
    constructor(config=null, interaction=null, client=null) {
        this.interaction = interaction;
        this.client = client;
        this.config = config;
        this.mm = new ModuleManager(client, config);

        // avoid crash due to missing unnecessary param
        if(config !== null) {
            this.db = new Database(config);
        }
    }

    loadTables() {
        return [
            `CREATE TABLE IF NOT EXISTS dc_revenues (id INT PRIMARY KEY NOT NULL auto_increment, amount VARCHAR(30), currency VARCHAR(30), platform VARCHAR(30), customer VARCHAR(30), project VARCHAR(255), date TIMESTAMP)`
        ];
    }

    loadCommands() {
        return [
            {
                name: "revenue-add",
                description: "Add a new revenue",
                options: [
                    {
                        name: "amount",
                        description: "The revenue amount.",
                        required: true,
                        type: "INTEGER"
                    },
                    {
                        name: "currency",
                        description: "The revenue's currency.",
                        required: true,
                        type: "STRING"
                    },
                    {
                        name: "platform",
                        description: "The revenue's platform.",
                        required: true,
                        type: "STRING"
                    },
                    {
                        name: "customer",
                        description: "The name of the customer who ordered.",
                        required: true,
                        type: "STRING",
                    },
                    {
                        name: "project",
                        description: "The name of the project lead.",
                        required: true,
                        type: "STRING"
                    }
                ]
            },
            {
                name: "revenue-del",
                description: "Delete an existing revenue"
            },
            {
                name: "revenue-list",
                description: "Display a list of revenue",
                options: [
                    {
                        name: "month",
                        description: "The number of the month.",
                        required: true, 
                        type: "INTEGER"
                    }
                ]
            }
        ];
    }

    selector() {
        if(this.interaction.isCommand()) {
            switch (this.interaction.command.name) {
                case "revenue-add":
                    this.add();
                    break;
                case "revenue-remove":
                    this.remove();
                    break;
                case "revenue-list":
                    this.list();
                    break;
            }
        }
    }

    add() {
        // def command options content for easier usage
        let options = {
            amount: this.interaction.options.getInteger("amount"),
            currency: this.interaction.options.getString("currency"),
            platform: this.interaction.options.getString("platform"),
            customer: this.interaction.options.getString("customer"),
            project: this.interaction.options.getString("project")
        }

        // def available params
        let availableCurrencies = ["€", "$"];
        let availablePlatform = ["fiverr", "paypal", "transfer", "upwork"]

        // check if currency param is correct
        if(!availableCurrencies.includes(options.currency)) {
            let passCorrectCurrencies = "";
            availableCurrencies.forEach((e) => {
                passCorrectCurrencies += `${e} - `
            });
            passCorrectCurrencies = passCorrectCurrencies.substr(0, passCorrectCurrencies.length-3);

            return this.mm.error(this.interaction, `${this.interaction.member}, The currency you typed is not available.\n\nPlease use one among these: ${"`" + passCorrectCurrencies + "`"}`);
        }

        // check if platform param is correct
        if(!availablePlatform.includes(options.platform)) {
            let passCorrectPlatforms = "";
            availablePlatform.forEach((e) => {
                passCorrectPlatforms += `${e} - `
            });
            passCorrectPlatforms = passCorrectPlatforms.substr(0, passCorrectPlatforms.length-3);

            return this.mm.error(this.interaction, `${this.interaction.member}, The platform you typed is not available.\n\nPlease use one among these: ${"`" + passCorrectPlatforms + "`"}`);
        }

        // push to database
        this.db.connection().getConnection(async (err, conn) => {
            if(err) throw err;
            // Save info into database at table dc_revenues
            await this.db.query(conn, `INSERT INTO dc_revenues (amount, currency, platform, customer, project, date) VALUES ("${options.amount}", "${options.currency}", "${options.platform}", "${options.customer}", "${options.project}", CURRENT_TIMESTAMP)`)

            this.db.connection().releaseConnection(conn);
        });

        //send confirmation message on discord
        this.interaction.reply({
            ephemeral: false,
            embeds: [
                new MessageEmbed()
                    .setThumbnail(this.interaction.member.user.avatarURL())
                    .setDescription("```You just added a new revenue!\nHere are the details.```")
                    .setColor("GREEN")
                    .addFields(
                        {
                            name: `Amount`,
                            value: `${"`" + `${options.amount}${options.currency}` + "`"}`,
                            inline: true
                        },
                        {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true
                        },
                        {
                            name: "Platform",
                            value: "`" + options.platform + "`",
                            inline: true
                        },
                        {
                            name: "Customer",
                            value: "`" + options.customer + "`",
                            inline: true
                        },
                        {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true
                        },
                        {
                            name: "Project",
                            value: "`" + options.project + "`",
                            inline: true
                        },
                        {
                            name: `Added on`,
                            value: `<t:${Math.floor(Date.now() / 1000)}>`,
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({text: this.interaction.guild.name, iconURL: this.interaction.guild.iconURL()})
            ]
        })
    }

    remove() {

    }

    list() {
        // def command options content for easier usage
        let options = {
            month: this.interaction.options.getInteger("month")
        }

        let months = [
            "January", 
            "Febrary", 
            "March", 
            "April", 
            "May", 
            "June", 
            "July", 
            "August", 
            "September", 
            "October", 
            "November", 
            "December"
        ]

        // check if month is valid
        if(options.month < 1 || options.month > 12) {
            return this.mm.error(this.interaction, `${this.interaction.member}, The month must be a number between 1 and 12.`);
        };

        this.db.connection().getConnection(async (err, conn) => {
            if(err) throw err;

            let Revenues = await this.db.query(conn, `SELECT * FROM dc_revenues`);
            let verifiedRevenues = [];

            for(const e of Revenues) {
                let month = new Date(e.date).getMonth();
                if(options.month-1 === month) {
                    verifiedRevenues.push(e);
                }
            }


            //display global infos and embed for each revenue.
            await this.interaction.reply(
                {
                    ephemeral: false, 
                    embed: [
                        new MessageEmbed()
                            .setDescription(
                                "```" + `Here are the ${months[month]}'s Revenues!` + "```"
                                )
                            .setThumbnail(this.interaction.guild.iconURL())
                            .setColor("GREEN")
                        
                    ]
                }
            )

            this.db.connection().releaseConnection(conn);
        });
    }
}


module.exports = {
    RevenuesManager
}

