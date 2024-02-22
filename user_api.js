const user_db = require("./user_db");
const debug_utils = require("./debug_utils");
const express = require("express");

module.exports = {

    /**
     * @param {express.Express} app
     * @param {user_db} user_db_manager
     */
    register : function(app, user_db_manager){
        app.get("/api/users/safe_username", async (req, res)=>{
            try{
                const result = await user_db.safe_username(req.query.username)
                res.end(200).send(result)
            }
            catch(e){
                res.end(e.code).send(e.message)
            }
            
        })

        app.post("/api/users/:user_id", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const password = req.body.password
                var user_data = await user_db_manager.create_normal(user_id, password)
                res.end(200).send(user_data)
            }
            catch(e){
                res.end(e.code).send(e.message)
            }
        })

        app.get("/api/users/:user_id", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const user_same = debug_utils.get_user_by_request(req) == user_id
                const user_data = await user_db_manager.get_user_data(user_id)
                user_data.verified_state = user_data.id_verify_data.verified_state
                if (!user_same){
                    delete user_data.email
                    delete user_data.realname
                    delete user_data.id_verify_data
                }
                res.end(200).send(user_data)
            }
            catch(e){
                res.end(e.code).send(e.message)
            }
        })

        app.put("/api/users/:user_id", async (req, res)=>{
            try{
                const user_id = req.params.user_id
                const user_same = debug_utils.get_user_by_request(req) == user_id
                const user_data = req.body
                if (!user_same){
                    throw {code: 403, message: "only self can modify user data"}
                }
                if (user_data){
                    await user_db_manager.user_config(user_data)   
                    res.end(200)
                }
                else{
                    throw {code: 400, message: "no data"}
                }
            }
            catch(e){
                res.end(e.code).send(e.message)
            }
        })



    }
}