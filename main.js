

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

    // await articles_manager.create_article("codingbear", "title", "content", "image_src")
    // await articles_manager.create_comment("163dee6c-4d43-4c10-b713-05c4a6bb541e", "tester", "hahahaha")
    // await articles_manager.bp_article("tester", "163dee6c-4d43-4c10-b713-05c4a6bb541e")
    // await articles_manager.gp_article("tester", "163dee6c-4d43-4c10-b713-05c4a6bb541e")
    // await articles_manager.delete_comment("3eac72a1-c53e-4086-8348-3a77fe679b33")
    // await articles_manager.edit_comment("3e9d5f83-d7b9-4d29-ba47-9f02536ef58c", "tester", "hmm")
    // await articles_manager.reply_comment("6c89331b-3b16-42fe-af98-757e0d0472e4", "tester2", "nvidia, fk u!")
    // console.log(await articles_manager.query_comment("3e9d5f83-d7b9-4d29-ba47-9f02536ef58c"))
    // await articles_manager.query_article_comments("163dee6c-4d43-4c10-b713-05c4a6bb541e")


}

sqlite_init()