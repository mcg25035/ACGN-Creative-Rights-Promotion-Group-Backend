const sqlite3 = require("sqlite3")
const db_utils = require("./db_utils")
const uuid = require("uuid")

class articles_db{
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
    get_time(){
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
        return await db_utils.column_exist(this.db, "articles", "id", `${id}`)
    }
    
    /**
     * @param {string} id 
     */
    async exist_comment(id){
        var found = await this.db.get(`select type from comments where id = ?`, id)
        if (!found) return false
        var {type} = found
        return type == "comment"
    }

    /**
     * @param {string} id  
     * @returns {boolean}
     */
    async exist_bpgp(id){
        var found = await this.db.get(`select type from comments where id = ?`, id)
        if (!found) return false
        var {type} = found
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
            throw {code: 409, message: "database not initialized"}
        }

        var id = await this.safe_uuid()

        const date = this.get_time()
        await this.db.run(
            `insert into articles values (?,?,?,?,?,?)`
            ,id, post_by, content, thumbnail, title, date
        )

        return id
    }

    /**
     * @param {string} by 
     * @param {string} target
     */
    async gp(by, target){
        if (!await this.exist_article(target) && !await this.exist_comment(target)) throw {code: 404, message: "article.error : gp target doesn't exist"}
        var gp_before = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "gp", by)
        var bp_before = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "bp", by)
        var date = this.get_time()
        var id = await this.safe_uuid()

        if (!gp_before){
            if (bp_before){
                await this.db.run(`delete from comments where target = ? and type = ? and by = ?`, target, "bp", by)
            }
            await this.db.run(`insert into comments values (?,?,?,?,?,?,?)`, date, id, by, target, "gp", "", 0)
        }
        else{
            await this.db.run(`delete from comments where target = ? and type = ? and by = ?`, target, "gp", by)
        }
    }

    /**
     * @param {string} by 
     * @param {string} target
     */
    async bp(by, target){
        if (!await this.exist_article(target) && !await this.exist_comment(target)) throw {code: 404, message: "article.error : bp target doesn't exist"}        
        var gp_before = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "gp", by)
        var bp_before = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "bp", by)
        var date = this.get_time()
        var id = await this.safe_uuid()

        if (!bp_before){
            if (gp_before){
                await this.db.run(`delete from comments where target = ? and type = ? and by = ?`, target, "gp", by)
            }
            await this.db.run(`insert into comments values (?,?,?,?,?,?,?)`, date, id, by, target, "bp", "", 0)
        }
        else{
            await this.db.run(`delete from comments where target = ? and type = ? and by = ?`, target, "bp", by)
        }
    }

    /**
     * @param {string} id
     */
    async delete_comment(id){
        if (!await this.exist_comment(id)) throw {code: 404, message: "comment doesn't exist"}
        await this.db.run(`update comments set state = 1 where id = ?`, id)
    }

    /**
     * @param {string} article
     * @param {string} by 
     * @param {string} content 
     */    
    async create_comment(article, by, content){
        if (!await this.exist_article(article)) throw {code: 404, message: "article doesn't exist"}
        var id = await this.safe_uuid()
        var date = this.get_time()
        await this.db.run(`insert into comments values (?,?,?,?,?,?,?)`, date, id, by, article, "comment", content, 0)
        return id
    }

    /**
     * @param {string} target 
     * @param {string} by 
     * @param {string} content 
     */
    async reply_comment(target, by, content){
        var parent = (await this.db.get(`select target from comments where id = ?`, target)).target
        var id = await this.safe_uuid()
        var date = this.get_time()
        if (!await this.exist_article(parent)) throw {code: 422, message: "nested reply is not allowed"}
        await this.db.run(`insert into comments values (?,?,?,?,?,?,?)`, date, id, by, target, "comment", content, 0)
        return id
    }

    /**
     * @param {string} id 
     * @param {string} by 
     * @param {string} content 
     */
    async edit_comment(id, by, content){
        var date = this.get_time()
        if (!await this.exist_comment(id)) throw {code: 404, message: "comment doesn't exist"}
        var date = this.get_time()
        var owned = (await this.db.get(`select by from comments where id = ?`, id)).by
        if (owned != by) throw {code: 403, message: "comment can only edited by it's owner."}
        await this.db.run(`update comments set state = ?, content = ?, date = ? where id = ?`, 2, content, date, id)
    }

    /**
     * @param {string} article
     * @param {string} sortBy
     * @param {string} lastId
     */
    async query_article_comments(article, sortBy, lastId){
        var allowed_sort = ["date-sb","date-bs","gp","bp","replies"]
        if (allowed_sort.indexOf(sortBy) == -1) throw {code: 422, message: "invalid sort type."}
        if (!await this.exist_article(article)) throw {code: 403, message: "article doesn't exist."}
        var result = []
        /**@type {Array<Object>} */
        var comments = await this.db.all(`select id from comments where target = ? and type = ?`, article, "comment")
        for (var comment of comments){
            result.push(await this.query_comment(comment.id))
        }        

        result.sort((a,b)=>{
            if (sortBy == "date-sb") return a.date - b.date
            if (sortBy == "date-bs") return b.date - a.date
            if (sortBy == "gp") return a.gp - b.gp
            if (sortBy == "bp") return a.bp - b.bp
            if (sortBy == "replies") return a.replies - b.replies
        })

        
        var last = lastId ? result.findIndex((element)=>{return element.id == lastId}) : -1
        result = result.slice(last+1, last+51)
        
        return result
    }

    /**
     * @param {string} target
     * @param {string} sortBy
     * @param {string} lastId
     */
    async query_comment_replies(target, sortBy, lastId){
        var allowed_sort = ["date-sb","date-bs","gp","bp","replies"]
        if (allowed_sort.indexOf(sortBy) == -1) throw {code: 422, message: "invalid sort type."}
        if (!await this.exist_comment(target)) throw {code: 403, message: "comment doesn't exist."}
        var result = []
        /**@type {Array<Object>} */
        var comments = await this.db.all(`select id from comments where target = ? and type = ?`, target, "comment")
        for (var comment of comments){
            result.push(await this.query_comment(comment.id))
        }        

        result.sort((a,b)=>{
            if (sortBy == "date-sb") return a.date - b.date
            if (sortBy == "date-bs") return b.date - a.date
            if (sortBy == "gp") return a.gp - b.gp
            if (sortBy == "bp") return a.bp - b.bp
            if (sortBy == "replies") return a.replies - b.replies
        })

        
        var last = lastId ? result.findIndex((element)=>{return element.id == lastId}) : -1
        result = result.slice(last+1, last+51)
        
        return result
    }

    /**
     * @param {string} id 
     */
    async query_comment(id){
        if (!await this.exist_comment(id)) throw {code: 404, message: "comment doesn't exist"}
        var comment_data = await this.db.get(`select * from comments where id = ?`, id)
        var bp_count = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "bp"))["count(*)"]
        var gp_count = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "gp"))["count(*)"]
        var replies_count = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "comment"))["count(*)"]
        comment_data.bp = bp_count
        comment_data.gp = gp_count
        comment_data.replies = replies_count
        return comment_data
    }

    /**
     * @param {string} id 
     * @param {string} by 
     * @param {string} title 
     * @param {string} content 
     * @param {string} thumbnail 
     */
    async edit_article(id, by, title, content, thumbnail){
        if (!await this.exist_article(id)) throw {code: 404, message: "article doesn't exist"}
        var date = this.get_time()
        var owned = (await this.db.get(`select post_by from articles where id = ?`, id)).post_by
        if (owned != by) throw {code: 403, message: "article can only edited by it's owner."}
        await this.db.run(`update articles set title = ?, content = ?, thumbnail = ?, date = ? where id = ?`, title, content, thumbnail, date, id)
    }

    /**
     * @param {string} id 
     */
    async delete_article(id){
        if (!await this.exist_article(id)) throw {code: 404, message: "article doesn't exist"}
        await this.db.run(`delete from articles where id = ?`, id)
        var comments = await this.db.all(`select id from comments where target = ?`, id)

        for (var comment of comments){
            await this.db.run(`delete from comments where target = ?`, comment.id)
            await this.db.run(`delete from comments where id = ?`, comment.id)
        }
    }

    /**
     * @param {string} id
     */
    async query_article(id){
        if (!await this.exist_article(id)) throw {code: 404, message: "article doesn't exist"}
        var article = await this.db.get(`select * from articles where id = ?`, id)
        article.bp = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "bp"))["count(*)"]
        article.gp = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "gp"))["count(*)"]
        article.comments = (await this.db.get(`select count(*) from comments where target = ? and type = ?`, id, "comment"))["count(*)"]
        return article
    }

    /**
     * @param {string} sortBy
     * @param {string} lastId
     */
    async query_articles(sortBy, lastId){
        var allowed_sort = ["date-sb","date-bs","gp","bp","replies"]
        var lastId = lastId
        if (allowed_sort.indexOf(sortBy) == -1) throw {code: 422, message: "invalid sort type."}
        var articles = await this.db.all(`select id from articles`)
        var result = []
        for (var article of articles){
            result.push(await this.query_article(article.id))
        }

        result.sort((a,b)=>{
            if (sortBy == "date-sb") return a.date - b.date
            if (sortBy == "date-bs") return b.date - a.date
            if (sortBy == "gp") return a.gp - b.gp
            if (sortBy == "bp") return a.bp - b.bp
            if (sortBy == "replies") return a.comments - b.comments
        })

        var last = lastId ? result.findIndex((element)=>{return element.id == lastId}) : -1
        result = result.slice(last+1, last+51)

        return result
    }

    /**
     * @param {string} target
     * @param {string} by
     */
    async query_bpgp_state(target, by){
        var gp = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "gp", by)
        var bp = await this.db.get(`select id from comments where target = ? and type = ? and by = ?`, target, "bp", by)
        if (gp) return {state: 1};
        if (bp) return {state: -1};
        return {state: 0};
    }



}

module.exports = articles_db
