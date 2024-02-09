

const sqlite3 = require("sqlite3")
const {open} = require("sqlite")
const db = new sqlite3.Database("data")
const db_utils = require("./db_utils")

const articles = require("./articles")

async function sqlite_init(){
    const db = await open({
        filename: "./database.db",
        driver: sqlite3.Database
    })

    const articles_manager = new articles()
    await articles_manager.init(db)

    
    
    await articles_manager.create_article("codingbear", "title_test", "content_tests", "img_src")



}

sqlite_init()