//RevenueManager.js// -- Created By Florian Lepage 01/17/2022

const { ModuleManager } = require("./ModuleManager.js");
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment} = require("discord.js");
const { Database } = require("../database/Database.js");
const { BinanceApi } = require("../Apis/BinanceApi.js");

class RevenuesManager {
    constructor(config=null, interaction=null, client=null) {
        this.interaction = interaction;
        this.client = client;
        this.config = config;
        this.mm = new ModuleManager(client, config);
        this.binance = new BinanceApi(config);

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
                        description: "The month you wish.",
                        required: true, 
                        type: "INTEGER"
                    },
                    {
                        name: "year",
                        description: "The year you wish.",
                        required: true,
                        type: "INTEGER"
                    }
                ]
            }
        ];
    }

    selector() {
        if(this.interaction.isCommand()) {
            if(this.interaction.command !== null) {
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
            month: this.interaction.options.getInteger("month"),
            year: this.interaction.options.getInteger("year")
        }

        // index month for embed display
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
        }

        // start pool connection to database (reduce the db latency)
        this.db.connection().getConnection(async (err, conn) => {
            if(err) throw err;

            // query database to retrieve all the revenues.
            let Revenues = await this.db.query(conn, `SELECT * FROM dc_revenues`);
            let verifiedRevenues = [];

            let revenuesStats = {
                eurEarned: 0,
                dollarEarned: 0,
                eurRevenuesAmount: 0,
            }

            // Sort revenues in function of the input month.
            for(const e of Revenues) {
                let month = new Date(e.date).getMonth();
                if(options.month-1 === month) {
                    verifiedRevenues.push(e);
                }
            }

            // Sort revenus in function of currency
            for(const e of verifiedRevenues) {
                e.currency === "$" ? revenuesStats.dollarEarned += parseInt(e.amount) : revenuesStats.eurEarned += parseInt(e.amount);
            }

            // Retrieve the dollar conversion rate based on the Binance USDT (Tether). -- Reason: 1 USD === 1 USDT (Cryptocurrency indexed on the US dollar rate).
            let dollarRate = await this.binance.currentCryptoData("EURUSDT");
            revenuesStats.eurRevenuesAmount = (revenuesStats.eurEarned + (revenuesStats.dollarEarned * dollarRate.prevClosePrice))

            //set first page to 0 (revenue stats)
            let pageId = 0;

            // add global revenue info to main embeds array
            let Embeds = [
                new MessageEmbed()
                    .setDescription("``` Here are the " + months[options.month-1] + "'s Revenues! ```")
                    .addFields(
                        {
                            name: "Total Earned in EUR",
                            value: "`" + `Total Earnings: ${revenuesStats.eurRevenuesAmount}€` + "`",
                            inline: true
                        },
                        {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true
                        },
                        {
                            name: "Revenues Entry",
                            value: "`" + `Entry: ${verifiedRevenues.length}` + "`",
                            inline: true
                        },
                        {
                            name: "Earnings in EUR",
                            value:  "`" + `Total: ${revenuesStats.eurEarned}€` + "`",
                            inline: true
                        },
                        {
                            name: '\u200B',
                            value: '\u200B',
                            inline: true
                        },
                        {
                            name: "Earnings in USD",
                            value: "`" + `Total: ${revenuesStats.dollarEarned}$` + "`",
                            inline: true
                        }
                    )
                    .setThumbnail(this.interaction.guild.iconURL())
                    .setColor("GREEN")
                    .setTimestamp()
                    .setFooter({text: this.interaction.guild.name, iconURL: this.interaction.guild.iconURL()})
            ];

            // sort revenues
            verifiedRevenues.sort((a, b) => {
                return new Date(a.date).getTime()  - new Date(b.date).getTime();
            });

            // push to main embed each revenue page
            for(let i = 0; verifiedRevenues.length > i; i++) {
                Embeds.push(
                    new MessageEmbed()
                        .addFields(
                            {
                                name: "Customer",
                                value: "`" + verifiedRevenues[i].customer + "`",
                                inline: true
                            },
                            {
                                name: '\u200B',
                                value: '\u200B',
                                inline: true
                            },
                            {
                                name: "Project",
                                value: "`" + verifiedRevenues[i].project + "`",
                                inline: true
                            },
                            {
                                name: "Earnings",
                                value:  "`" + `Total: ${verifiedRevenues[i].amount}${verifiedRevenues[i].currency}` + "`",
                                inline: true
                            },
                            {
                                name: '\u200B',
                                value: '\u200B',
                                inline: true
                            },
                            {
                                name: "Platform",
                                value: "`" + verifiedRevenues[i].platform + "`",
                                inline: true
                            },
                            {
                                name: `Earned On`,
                                value: `<t:${new Date(verifiedRevenues[i].date).getTime() / 1000}>`,
                                inline: false
                            }
                        )
                        .setThumbnail(this.interaction.guild.iconURL())
                        .setColor("GREEN")
                        .setTimestamp()
                        .setFooter({text: `Page: ${i+1} - Rev id: ${verifiedRevenues[i].id}`, iconURL: this.interaction.guild.iconURL()})
                )
            }

            // send reply with arrow button. (first page = stats)
            await this.interaction.reply(
                {
                    ephemeral: false,
                    embeds: [
                        Embeds[0]
                    ],
                    components: [
                        new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`list_first_${this.interaction.member.user.id}`)
                                    .setEmoji("<:image0:894240410917044234>")
                                    .setStyle("SUCCESS")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`list_prev_${this.interaction.member.user.id}`)
                                    .setEmoji("<:image1:894240394164973618>")
                                    .setStyle("SUCCESS")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`list_next_${this.interaction.member.user.id}`)
                                    .setEmoji("<:image2:894240377446498346>")
                                    .setStyle("SUCCESS")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`list_last_${this.interaction.member.user.id}`)
                                    .setEmoji("<:image3:894240359817826335>")
                                    .setStyle("SUCCESS")
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId(`chart_${this.interaction.member.user.id}`)
                                    .setEmoji("📊")
                                    .setStyle("PRIMARY")
                            )
                    ]
                }
            );

            // fetch reply message for collector
            let buttonMsg = await this.interaction.fetchReply();

            // setup button collector
            const collector = buttonMsg.createMessageComponentCollector((button) => button.clicker.user.id === this.interaction.member.user.id);

            // button collector
            collector.on("collect", async (b) => {
                switch (b.customId) {
                    case `list_next_${this.interaction.member.user.id}`:
                        if(pageId+1 <= (Embeds.length-1)) {
                            pageId++

                            await buttonMsg.edit(
                                {
                                    embeds: [
                                        Embeds[pageId]
                                    ],
                                    files: [

                                    ]
                                }
                            ).then().catch(console.error);
                        }
                        await b.deferUpdate()

                        break;
                    case `list_prev_${this.interaction.member.user.id}`:
                        if(pageId-1 >= 0) {
                            pageId--

                            await buttonMsg.edit(
                                {
                                    embeds: [
                                        Embeds[pageId]
                                    ],
                                    files: [

                                    ]
                                }
                            ).then().catch(console.error);
                        }
                        await b.deferUpdate()

                        break;
                    case `list_first_${this.interaction.member.user.id}`:
                        pageId = 1

                        await buttonMsg.edit(
                            {
                                embeds: [
                                    Embeds[pageId]
                                ],
                                files: [

                                ]
                            }
                        ).then().catch(console.error);

                        await b.deferUpdate()

                        break;
                    case `list_last_${this.interaction.member.user.id}`:
                        pageId = Embeds.length - 1

                        await buttonMsg.edit(
                            {
                                embeds: [
                                    Embeds[pageId]
                                ],
                                files: [

                                ]
                            }
                        ).then().catch(console.error);

                        await b.deferUpdate()

                        break;
                    case `chart_${this.interaction.member.user.id}`:
                        const monthDay = this.mm.getDaysInCurrentMonth(new Date(options.year, options.month-1));

                        let buffer = await this.createGraph(verifiedRevenues, monthDay, months[options.month-1]);

                        let file = new MessageAttachment(buffer, "chart.png")

                        let embed = Embeds[0]

                        embed.image = {
                            url: "attachment://chart.png",
                        }

                        await buttonMsg.edit(
                            {
                                embeds: [
                                    embed
                                ],
                                files: [
                                    file
                                ]
                            }
                        ).then().catch(console.error);

                        await b.deferUpdate()

                        break;
                }
            });

            // close pool connection
            this.db.connection().releaseConnection(conn);
        });
    }

    async createGraph(revenues, day, month) {
        const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
        const width = 1280; //px
        const height = 720; //px
        const backgroundColour = '#2f3136';
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});

        let labels = [];
        let vData = [];

        // display day number with proper suffix
        for(let i = 1; day >= i; i++) {
            switch (i) {
                case 1:
                    labels.push("1st")
                    break;
                case 2:
                    labels.push("2nd")
                    break;
                case 3:
                    labels.push("3rd")
                    break;
                case 21:
                    labels.push("21st")
                    break;
                case 22:
                    labels.push("22nd")
                    break;
                case 23:
                    labels.push("23rd")
                    break;
                case 31:
                    labels.push("31st")
                    break;
                default:
                    labels.push(`${i}th`);
                    break;
            }
        }

        // Step1: sum of earning per day each day
        let dataExpanded = [];
        for(const e of revenues) {
            let date = new Date(e.date);
            if(!dataExpanded.some(fn => fn.date === date.getDate())) {
                dataExpanded.push(
                    {
                        amount: parseInt(e.amount),
                        date: date.getDate(),
                    }
                )
            } else {
                dataExpanded.find(fn => fn.date === date.getDate()).amount += parseInt(e.amount);
            }
        }

        // step2: sort data & push validated earning on each day
        for(let i = 1; day >= i; i++) {
            if(dataExpanded.some(fn => fn.date === i)) {
                vData.push(dataExpanded.find(fn => fn.date === i).amount);
            } else {
                vData.push(0);
            }
        }

        const data = {
            labels: labels,
            datasets: [{
                label: `${month}'s revenues`,
                data: vData,
                backgroundColor: [
                    'rgba(46, 204, 113, 0.2)',
                ],
                borderColor: [
                    'rgb(46, 204, 113, 0.4)',
                ],
                borderWidth: 0.5
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#ffffff",
                            font: {
                                size: 18
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: "#ffffff",
                            font: {
                                size: 15
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            //color: 'rgb(255, 255, 255)'
                        }
                    }
                }
            },
        };

        return await chartJSNodeCanvas.renderToBuffer(config);
    }
}


module.exports = {
    RevenuesManager
}

