const sqlite3 = require("sqlite3")

module.exports = {
    /**
     * @param {sqlite3.Database} db 
     * @param {string} db_name 
     * @param {Array<string>} args 
     */
    async create_table(db, db_name, args){
        var args_ = "("
        args.map((element)=>{ args_+=(element+",") })
        args_ = args_.slice(0,-1)
        args_ += ")"

        await db.exec(
            `create table if not exists ${db_name} ${args_}`
        )
    },

    /**
     * @param {sqlite3.Database} db 
     * @param {string} table 
     * @param {string} column_name 
     * @param {string} value 
     * @returns {boolean}
     */
    async column_exist(db, table, column_name, value){
        const result = await db.get(`select ${column_name} from ${table} where ${column_name} = ?`, value);
        if (result) return true;
        return false;
    }
}

