const users_db = require("./users_db");
const debug_utils = require("./debug_utils");
const express = require("express");

const session = require("express-session")
const users_session = require("./users_session")


module.exports = {

    /**
     * @param {express.Express} app
     * @param {users_db} users_db_manager
     */
    register : function(app, users_db_manager){
        // app.get("/api/")

        app.get("/api/users/safe_username/:username", async (req, res)=>{
            try{
                const result = await users_db_manager.safe_username(req.params.username)
                res.status(200).send(result)
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
            
        })

        app.post("/api/users/:user_id/normal", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const password = req.body.password
                if (!password) throw {code: 400, message: "password is needed"}
                var user_data = await users_db_manager.create_normal(user_id, password)
                res.status(200).send(user_data)
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })

        app.get("/api/users/get_login_state", async (req, res)=>{
            try{
                console.log(req.session)
                const user_id = users_session.get_user_from_session(req.session.user_id)
                if (!user_id) throw {code: 403, message: "not logged in"}
                const user_data = await users_db_manager.get_user_data(user_id)
                res.status(200).send(user_data)
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })

        app.put("/api/users/:user_id/login", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const password = req.body.password
                if (!password) throw {code: 400, message: "password is needed"}
                const user_data = await users_db_manager.auth(user_id, password)
                if (!user_data) throw {code: 403, message: "auth failed"}
                req.session.user_id = users_session.create_session(user_id)
                console.log(req.session)
                res.status(200).send("login success")
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })


        app.get("/api/users/:user_id", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const user_same = users_session.get_user_from_session(req.session.user_id) == user_id
                const user_data = await users_db_manager.get_user_data(user_id)
                user_data.verified_state = user_data.id_verify_data.verified_state
                if (!user_same){
                    delete user_data.email
                    delete user_data.realname
                    delete user_data.id_verify_data
                }
                res.status(200).send(user_data)
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })

        app.put("/api/users/:user_id", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const user_same = users_session.get_user_from_session(req.session.user_id) == user_id
                const user_data = req.body
                if (!user_same){
                    throw {code: 403, message: "only account owner can modify self's data"}
                }
                if (user_data){
                    await users_db_manager.user_config(user_id, user_data)   
                    res.status(200).send("update complete")
                }
                else{
                    throw {code: 400, message: "no data"}
                }
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })

        app.put("/api/users/:user_id/email_verify", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const verify_code = req.body.code
                const email = req.body.email
                if (!verify_code) throw {code: 400, message: "code is needed"}
                if (!email) throw {code: 400, message: "email is needed"}
                await users_db_manager.verify(verify_code, email)
                res.status(200).send("verify success")
            }
            catch(e){
                res.status(e.code).send(e.message)
            }
        })



    }
}