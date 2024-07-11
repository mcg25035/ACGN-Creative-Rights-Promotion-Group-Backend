const sqlite3 = require("sqlite3")
const db_utils = require("./db_utils")
const uuid = require("uuid")
const nodemailer = require("nodemailer")
const smtpTransport = require("nodemailer-smtp-transport")

var transporter = nodemailer.createTransport(smtpTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "noreply.acgn.rights.promotion@gmail.com",
        pass: "mytt tngw hpws lwoy"
    }
}))




class users_db{
    // userId permission nickname realname isMember idVerifyData bpCount gpCount 

    /**
     * @typedef {Object} id_verify_data
     * @property {Number} verified_state
     * @property {Number} verified_time
     * @property {string} verified_by
     * @property {string} id
     */

    /**
     * @typedef {Object} user_data
     * @property {string} user_id
     * @property {string} password
     * @property {string} email
     * @property {Number} permission
     * @property {string} nickname
     * @property {string} realname
     * @property {Number} is_member
     * @property {id_verify_data} id_verify_data
     */

    /**
     * @typedef {Object} email_verify_data
     * @property {string} code
     * @property {Number} end_time
     * @property {string} user_id
     */

    db_init = false
    /**@type {sqlite3.Database} */
    db
    email_verifing = {}

    /**
     * @returns {string}
     */
    six_digit_code(){
        return Math.floor(Math.random() * 1000000).toString().padStart(6, "0")
    }

    /**
     * @param {string} subject 
     * @param {string} text 
     * @param {string} to 
     * @returns 
     */
    send_email(subject, text, to){
        return new Promise((resolve, reject)=>{
            var mailOptions = {
                from: "noreply.acgn.rights.promotion@gmail.com",
                to: to,
                subject: subject,
                text: text
            }
        
            transporter.sendMail(mailOptions, (error, info)=>{
                if (error){
                    reject(error)
                }else{
                    resolve(info)
                }
            })
        })
    }

    /**
     * @param {string} user_id
     * @param {string} email
     * @returns {string}
     */
    async get_verify_code(user_id, email){
        if(!this.db_init) throw new Error("db not initialized")
        if (await this.exist_email(email)) return null
        var data = {code: this.six_digit_code(), end_time: Date.now() + 1000 * 60 * 10, user_id: user_id}
        this.email_verifing[email] = data
        return data.code
    }


    /**
     * @returns {id_verify_data}
     */
    empty_id_verify_data(){
        return {
            verified_state: 0,
            verified_time: null,
            verified_by: null,
            id: "Z000000000",
        }
    }
    
    /**@param {sqlite3.Database} db  */
    async init(db){
        this.db = db
        await db_utils.create_table(db, "user_data", [
            "user_id",
            "password",
            "email",
            "permission",
            "nickname",
            "realname",
            "is_member",
            "id_verify_data",
            "avatar",
            "self_description_article"
        ])

        this.db_init = true
    }

    /**
     * @param {string} user_id 
     * @returns {boolean}
     */
    async exist_user(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        return await db_utils.column_exist(this.db, "user_data", "user_id", user_id)
    }

    /**
     * @param {string} email
     * @returns {boolean}
     */
    async exist_email(email){
        if(!this.db_init) throw new Error("db not initialized")
        return await db_utils.column_exist(this.db, "user_data", "email", email)
    }

    /**
     * @param {string} user_id 
     * @returns {string}
     */
    async safe_username(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        var raw_user_id = user_id
        var suffix = 0

        while (await this.exist_user(user_id)){
            user_id = raw_user_id + suffix
            suffix++
        }

        return user_id
    }

    /**
     * @param {string} user_id 
     * @returns {user_data}
     */
    async get_user_data(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        var user_data = await this.db.get(`SELECT * FROM user_data WHERE user_id = ?`, user_id)
        delete user_data.password
        return user_data
    }
        

    /**
     * @param {string} user_id
     * @param {string} password
     * @param {string} email 
     */
    async create_normal(user_id, password){
        if(!this.db_init) throw new Error("db not initialized")

        user_id = await this.safe_username(user_id)
        var permission = 0
        var nickname = user_id
        var realname = null
        var is_member = 0
        var id_verify_data = this.empty_id_verify_data()
        var avatar = null
        var self_description_article = null
        this.db.run(
            `INSERT INTO user_data (user_id, password, email, permission, nickname, realname, is_member, id_verify_data, avatar, self_description_article)`
            +` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            user_id, password, null, permission, nickname, realname, is_member, JSON.stringify(id_verify_data), avatar, self_description_article
        )
        return {user_id: user_id}
    }

    /**
     * @param {user_id} string
     * @param {user_data} config 
     */
    async user_config(user_id, config){
        if(!this.db_init) throw new Error("db not initialized")
        if (this.exist_user(user_id))
        var password = config.password
        var email = config.email
        var nickname = config.nickname
        var realname = config.realname 
        var avatar = config.avatar
        var self_description_article = config.self_description_article
        var user_email = await this.db.get(`SELECT email FROM user_data WHERE user_id = ?`, user_id)

        if (password){
            this.db.run(`UPDATE user_data SET password = ? WHERE user_id = ?`, password, user_id)
        }

        if (nickname){
            this.db.run(`UPDATE user_data SET nickname = ? WHERE user_id = ?`, nickname, user_id)
        }

        if (realname){
            this.db.run(`UPDATE user_data SET realname = ? WHERE user_id = ?`, realname, user_id)
        }

        if (avatar){
            this.db.run(`UPDATE user_data SET avatar = ? WHERE user_id = ?`, avatar, user_id)
        }

        if (self_description_article){
            this.db.run(`UPDATE user_data SET self_description_article = ? WHERE user_id = ?`, self_description_article, user_id)
        }
        
        if (email && email != user_email){
            var verify_code = await this.get_verify_code(user_id, email)
            try{
                await this.send_email("ACGN Rights Promotion Email Verification", `Your verification code is ${verify_code}`, email)
            }
            catch(err){
                console.log(err)
                throw {code: 500, message: "email send failed, please try again later"}
            }
        }
    }

    /**
     * @param {string} code
     * @param {string} email
     */
    async verify(code, email){
        if (!this.email_verifing[email]){
            throw {code: 404, message: "email not found"}
        }

        if (this.email_verifing[email].code !== code){
            throw {code: 403, message: "code not match"}
        }

        if (this.email_verifing[email].end_time < Date.now()){
            throw {code: 403, message: "code expired"}
        }

        this.db.run(`UPDATE user_data SET email = ? WHERE user_id = ?`, email, this.email_verifing[email].user_id)
        delete this.email_verifing[email]
    }

    /**
     * @param {string} user_id 
     */
    async delete_user(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        await db_utils.delete(this.db, "user_data", "userId", user_id)
    }

    /**
     * @param {string} user_id
     * @param {string} password
     * @returns {boolean}
     */
    async auth(user_id, password){
        if(!this.db_init) throw new Error("db not initialized")
        var user_data = await this.db.get(`SELECT password FROM user_data WHERE user_id = ?`, user_id)
        if (!user_data) return false
        return user_data.password == password
    }


}

module.exports = users_db