const articles_db = require("./articles_db");
const debug_utils = require("./debug_utils");
const express = require("express");

module.exports = {

    /**
     * @param {express.Express} app
     * @param {articles_db} articles_db_manager
     */
    register : function(app, articles_db_manager){
        app.get('/api/articles', async (req, res) => {
            // TODO: Implement logic to get articles
        })

        
        app.get('/api/articles/:article_id', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var article = await articles_db_manager.query_article(article_id)
                res.status(200).send(article)
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.get('/api/articles/:article_id/comments', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var sortBy = req.query.sortBy
                var lastId = req.query.lastId
                var comments = await articles_db_manager.query_article_comments(article_id, sortBy, lastId)
                res.status(200).send({comments: comments})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.get('/api/articles/:article_id/comments/:comment_id/replies', async (req, res) => {
            try{
                var comment_id = req.params.comment_id
                var sortBy = req.query.sortBy
                var lastId = req.query.lastId
                var comments = await articles_db_manager.query_comment_replies(comment_id, sortBy, lastId)
                res.status(200).send({comments: comments})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var user = debug_utils.get_user_by_request(req)
                var title = req.body.title
                var content = req.body.content
                var thumbnail = req.body.thumbnail
                if (!title || !content || !thumbnail) throw {code: 400, message: "missing fields"}
                await articles_db_manager.edit_article(article_id, user, title, content, thumbnail)
                res.status(200).send("article edited")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id/bp', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_bpgp") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                await articles_db_manager.bp(user, article_id)
                res.status(200).send("operation success")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id/gp', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_bpgp") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                await articles_db_manager.gp(user, article_id)
                res.status(200).send("operation success")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id/comments/:comment_id', async (req, res) => {
            try{
                var comment_id = req.params.comment_id
                var user = debug_utils.get_user_by_request(req)
                var content = req.body.content
                if (!content) throw {code: 400, message: "missing fields"}
                await articles_db_manager.edit_comment(comment_id, user, content)
                res.status(200).send("comment edited")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id/comments/:comment_id/gp', async (req, res) => {
            try{
                var comment_id = req.params.comment_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_bpgp") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                await articles_db_manager.gp(user, comment_id)
                res.status(200).send("comment gp'ed")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.put('/api/articles/:article_id/comments/:comment_id/bp', async (req, res) => {
            try{
                var comment_id = req.params.comment_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_bpgp") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                await articles_db_manager.bp(user, comment_id)
                res.status(200).send("comment bp'ed")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.post('/api/articles', async (req, res) => {
            try{
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_post") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                var title = req.body.title
                var content = req.body.content
                var thumbnail = req.body.thumbnail
                if (!title || !content || !thumbnail) throw {code: 400, message: "missing fields"}
                var article_id = await articles_db_manager.create_article(user, title, content, thumbnail)
                res.status(200).send({id: article_id, message: "article created"})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send({"message": exception.message})
                return res.end()
            }
        })

        
        app.post('/api/articles/:article_id/comments', async (req, res) => {
            try{
                var content = req.body.content
                var article_id = req.params.article_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_post") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                var comment_id = await articles_db_manager.create_comment(article_id, user, content)
                res.status(200).send({id: comment_id, message: "comment created"})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.post('/api/articles/:article_id/comments/:comment_id/reply', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var comment_id = req.params.comment_id
                var user = debug_utils.get_user_by_request(req)
                var allowed = debug_utils.permission_compare(user, "allow_post") >= 0
                if (!allowed) throw {code: 403, message: "permission denied"}
                var content = req.body.content
                if (!content) throw {code: 400, message: "missing fields"}
                var comment_id = await articles_db_manager.reply_comment(comment_id, user, content)
                res.status(200).send({id: comment_id ,message: "reply created"})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.delete('/api/articles/:article_id', async (req, res) => {
            try{
                var article_id = req.params.article_id
                var user = debug_utils.get_user_by_request(req)
                if (!article_id) throw {code: 400, message: "missing fields"}
                if (!user) throw {code: 400, message: "missing fields"}
                var article = await articles_db_manager.query_article(article_id)
                var allowed = (debug_utils.permission_compare(user, "allow_admin") >= 0 || user == article.post_by)
                if (!allowed) throw {code: 403, message: "permission denied"}
                await articles_db_manager.delete_article(article_id, user)
                res.status(200).send("article deleted")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        
        app.delete('/api/comments/:comment_id', async (req, res) => {
            try{
                var comment_id = req.params.comment_id
                var user = debug_utils.get_user_by_request(req)
                await articles_db_manager.delete_comment(comment_id, user)
                res.status(200).send("comment deleted")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })
        

    }
}