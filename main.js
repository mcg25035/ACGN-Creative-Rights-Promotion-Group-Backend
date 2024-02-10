const sqlite3 = require("sqlite3")
const {open} = require("sqlite")
const db = new sqlite3.Database("data")
const db_utils = require("./db_utils")
const express = require("express")
const app = express()
app.use(express.json())

const articles_db = require("./articles_db")
var articles_db_manager = new articles_db()

const articles_api = require("./articles_api")




// app.post('/api/articles')




async function main(){
    await sqlite_init()

    articles_api.register(app, articles_db_manager)
    
    app.listen(3000, ()=>{
        console.log("Server is running on port 3000")
    })
}


main()