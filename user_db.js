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




class user_db{
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

    static send_email(subject, text, to){
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
     * @returns {Object}
     */
    static async get_verify_code(user_id, email){
        if(!this.db_init) throw new Error("db not initialized")
        if (await this.exist_email(email)) return null
        var data = {code: uuid.v4(), end_time: Date.now() + 1000 * 5 * 10, user_id: user_id}
        this.email_verifing[email] = data.code
        return data.code
    }


    /**
     * @returns {id_verify_data}
     */
    static empty_id_verify_data(){
        return {
            verified_state: 0,
            verified_time: null,
            verified_by: null,
            id: "Z000000000",
        }
    }
    
    /**@param {sqlite3.Database} db  */
    static async init(db){
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
    static async exist_user(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        return await db_utils.column_exist(this.db, "user_data", "user_id", user_id)
    }

    /**
     * @param {string} email
     * @returns {boolean}
     */
    static async exist_email(email){
        if(!this.db_init) throw new Error("db not initialized")
        return await db_utils.column_exist(this.db, "user_data", "email", email)
    }

    /**
     * @param {string} user_id 
     * @returns {string}
     */
    static async safe_username(user_id){
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
     * @param {string} password
     * @param {string} email 
     */
    static async create_normal(user_id, password){
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
            user_id, password, null, permission, nickname, realname, is_member, JSON.stringify(id_verify_data), avatar, null
        )
    }

    /**
     * @param {user_data} config 
     */
    static async user_config(config){
        if(!this.db_init) throw new Error("db not initialized")
        
        var user_id = config.user_id
        if (this.exist_user(user_id))
        var password = config.password
        var email = config.email
        var nickname = config.nickname
        var realname = config.realname 
        var avatar = config.avatar
        
        if (email){
            this.get_verify_code()
            try{
                await this.send_email("ACGN Rights Promotion Email Verification", `Your verification code is ${this.email_verifing[email].code}`, email)
            }
            catch(err){
                console.log(err)
                throw {code: 500, message: "email send failed, please try again later"}
            }
        }

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
    }

    /**
     * @param {string} code
     * @param {string} email
     */
    static async verify(code, email){
        if (this.email_verifing[email]){
            throw {code: 404, message: "email not found"}
        }

        if (this.email_verifing[email] !== code){
            throw {code: 403, message: "code not match"}
        }

        if (this.email_verifing[email].end_time < Date.now()){
            throw {code: 403, message: "code expired"}
        }

        this.db.run(`UPDATE user_data SET email = ? WHERE user_id = ?`, email, this.email_verifing[email].user_id)
    }

    /**
     * @param {string} user_id 
     */
    static async delete_user(user_id){
        if(!this.db_init) throw new Error("db not initialized")
        await db_utils.delete(this.db, "user_data", "userId", user_id)
    }


}

module.exports = user_db