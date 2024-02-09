const sqlite3 = require("sqlite3")

class user{
    /**
     * @param {sqlite3.Database} db
     */
    constructor(db) {
        var userdata = [
            "username",
            "password",
            "verify_type",
            "id",
            "email",
            

        ]

        db.exec(
            "create table if not exists userdata ()"
        )
        
    }
}