//SQLTablesManager.js// -- Created By Florian Lepage 04/02/2022
// import database module
const { Database } = require("../database/Database.js");

// import SQL modules
const { RevenuesManager } = require("./RevenuesManager.js");

class SQLTablesManager{
    constructor(config) {
        this.config = config;
        this.db = new Database(config).connection();
    }

    loadTables() {
        let modules = [
            new RevenuesManager().loadTables()
        ];

        this.db.getConnection((err, conn) => {
            if(err) throw err;

            for(const m of modules) {
                m.forEach((e) => {
                    conn.query(e, (err) => {
                        if(err) throw err;
                    })
                });
            }

            this.db.releaseConnection(conn);
        });
    }
}

module.exports = {
    SQLTablesManager
}