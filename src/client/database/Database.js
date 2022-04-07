//Database.js// --Created by Florian Lepage 10/28/2020

// mysql2 lib import
const mysql = require("mysql2");

class Database {
    constructor(token, time=null) {
        this.dbUsername = token.database.username;
        this.dbDatabase = token.database.database;
        this.dbPassword = token.database.password;
        this.dbHost = token.database.host;
        this.dbPort = token.database.port;
        this.time = time;
    }
    connection() { // connection method for mysql queries
        return mysql.createPool({
            user: this.dbUsername,
            database: this.dbDatabase,
            password: this.dbPassword,
            host: this.dbHost,
            port: this.dbPort,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    checkConnectionState() { // method to check if the mysql connection state is efficient
        this.connection().query(`SHOW DATABASES`, (err) => {
            if(err) {
                throw err;
            } else {
                return console.log(`The connection between the client & the Database has been established.`);
            }
        });
    }

    query(conn, query) {
        return new Promise((resolve, reject) => {
            const result = conn.query(query, function (err, result, fields) {
                if (err) throw err;

                result ? resolve(result) : reject();
            });
        });
    }
}

module.exports = {
    Database
}