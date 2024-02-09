const sqlite3 = require("sqlite3")
const db_utils = require("./db_utils")
const uuid = require("uuid")

class articles{
    db_init = false
    /**@type {sqlite3.Database} */
    db
    
    /**@param {sqlite3.Database} db  */
    async init(db){
        this.db = db
        await db_utils.create_table(db, "articles", [
            "id",
            "post_by",
            "content",
            "thumbnail",
            "title",
            "date"
        ])

        // Watch for SQL Injection!
        await db_utils.create_table(db, "comments", [
            "date",
            "id",
            "by",
            "target",
            "type",
            "content",
            "state" //0 : none , 1 : deleted , 2 : edited
        ])
        this.db_init = true
    }

    /**
     * @returns {Number}
     */
    async get_time(){
        return (new Date()).getTime()
    }

    /**
     * @returns {string}
     */
    async safe_uuid(){
        var id
        do{id = uuid.v4()}
        while(await this.exist_article(id) || await this.exist_bpgp(id) || await this.exist_comment(id))
        return id
    }

    /**
     * @param {string} id  
     * @returns {boolean}
     */
    async exist_article(id){
        return await db_utils.column_exist(this.db, "articles", "id", `'${id}'`)
    }
    
    /**
     * @param {string} id 
     */
    async exist_comment(id){
        var type = this.db.get(`select type from comments where id = ${id}`)
        return type == "comment"
    }

    /**
     * @param {string} id  
     * @returns {boolean}
     */
    async exist_bpgp(id){
        var type = this.db.get(`select type from comments where id = ${id}`)
        return (type == "bp" || type == "gp")
    }

    /**
     * @param {string} post_by 
     * @param {string} title 
     * @param {string} content 
     * @param {string} thumbnail 
     */
    async create_article(post_by, title, content, thumbnail){
        if (!this.db_init){
            throw "article.error : articles is not initialzed"
        }

        var id = this.safe_uuid()

        const date = this.get_time()
        await this.db.exec(
            `insert into articles values ('${id}','${post_by}','${content}','${thumbnail}','${title}',${date})`
        )
    }

    /**
     * @param {string} by 
     * @param {string} target
     */
    async gp_article(by, target){
        if (!this.exist_article(target) && !this.exist_comment(target)) throw "article.error : gp target doesn't exist"
        var condition = (type)=>{return ` where target = ${target} and type = ${type} and by = '${by}'`}
        var gp_before = this.db.get(`select id from comments`+condition("gp"))
        var bp_before = this.db.get(`select id from comments`+condition("bp"))
        var date = this.get_time()

        var id = this.safe_uuid()

        if (!gp_before){
            if (bp_before){
                this.db.exec(`delete from comments`+condition("bp"))
            }
            this.db.exec(`insert into comments values ('${date}','${id}','${by}','${target}',gp,'',0)`)
        }

        this.db.exec(`delete from comments`+condition("gp"))
    }

    /**
     * @param {string} by 
     * @param {string} target
     */
    async bp_article(by, target){
        if (!this.exist_article(target) && !this.exist_comment(target)) throw "article.error : bp target doesn't exist"
        var condition = (type)=>{return ` where target = ${target} and type = ${type} and by = '${by}'`}
        var gp_before = this.db.get(`select id from comments`+condition("gp"))
        var bp_before = this.db.get(`select id from comments`+condition("bp"))

        var id = this.safe_uuid()

        if (!bp_before){
            if (gp_before){
                this.db.exec(`delete from comments`+condition("gp"))
            }
            this.db.exec(`insert into comments values ('${date}','${id}','${by}','${target}',bp,'',0)`)
        }

        this.db.exec(`delete from comments`+condition("bp"))
    }

    /**
     * @param {string} id
     */
    async delete_comment(id){
        if (!this.exist_comment(id)) throw "article.error : comment doesn't exist";
        this.db.exec(`update comments set state = 1 where id = ${id}`)
    }

    /**
     * @param {string} article
     * @param {string} by 
     * @param {string} content 
     */    
    async create_comment(article, by, content){
        if (!this.exist_article(article)) throw "article.error : article doesn't exist"
        var id = this.safe_uuid()
        var date = this.get_time()
        this.db.exec(`insert into comments values ('${date}','${id}','${by}','${article}',comment,'${content}',0)`)
    }

    /**
     * @param {string} target 
     * @param {string} by 
     * @param {string} content 
     */
    async reply_comment(target, by, content){
        var parent = this.db.get(`select target from comments where id = ${target}`)
        var id = this.safe_uuid()
        var date = this.get_time()
        if (!this.exist_article(parent)) throw "article.error : nested reply is not allowed"
        this.db.exec(`insert into comments values ('${date}','${id}','${by}','${target}','comment','${content}',0)`)
    }

    /**
     * @param {string} id 
     * @param {string} by 
     * @param {string} content 
     */
    async edit_comment(id, by, content){
        var date = this.get_time()
        if (!this.exist_comment(id)) throw "article.error : comment doesn't exist."
        var date = this.get_time()
        var owned = this.db.get(`select by from comments where id = ${id}`)
        if (owned != by) throw "article.error : comment can only edited by it's owner."
        this.db.exec(`update comments set state = 2, content = '${content}', date = ${date} where id = ${id}`)
    }

    /**
     * @param {string} article
     * @param {string} lastId
     */
    async query_article_comments(article, lastId){
        if (!this.exist_comment(article)) throw "article.error : comment doesn't exist."
        var comments = this.db.get(`select id from comments where target = ${article} and type = comment`)
        console.log(comments)
    }



    /**
     * @param {string} id 
     */
    async query_comment(id){
        if (!this.exist_comment(id)) throw "article.error : comment doesn't exist";
        var comments = this.db.get(`select * from comments where id = ${id}`)
    }

}

module.exports = articles