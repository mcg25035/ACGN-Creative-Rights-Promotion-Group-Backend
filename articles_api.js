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
            var article_id = req.params.article_id
            try{
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
            var article_id = req.params.article_id
            var sortBy = req.query.sortBy
            var lastId = req.query.lastId
            try{
                var comments = await articles_db_manager.query_article_comments(article_id, sortBy, lastId)
                res.status(200).send({comments: comments})
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.put('/api/articles/:article_id', async (req, res) => {
            var article_id = req.params.article_id
            var user = debug_utils.get_user_by_request(req)
            var title = req.body.title
            var content = req.body.content
            var thumbnail = req.body.thumbnail
            try{
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
            var article_id = req.params.article_id
            var user = debug_utils.get_user_by_request(req)
            try{
                await articles_db_manager.bp(user, article_id)
                res.status(200).send("article bp'ed")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.put('/api/articles/:article_id/gp', async (req, res) => {
            var article_id = req.params.article_id
            var user = debug_utils.get_user_by_request(req)
            try{
                await articles_db_manager.gp(user, article_id)
                res.status(200).send("article gp'ed")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.put('/api/articles/:article_id/comments/:comment_id', async (req, res) => {
            var comment_id = req.params.comment_id
            var user = debug_utils.get_user_by_request(req)
            var content = req.body.content
            try{
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
            var comment_id = req.params.comment_id
            var user = debug_utils.get_user_by_request(req)
            try{
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
            var comment_id = req.params.comment_id
            var user = debug_utils.get_user_by_request(req)
            try{
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
            var user = debug_utils.get_user_by_request(req)
            var title = req.body.title
            var content = req.body.content
            var thumbnail = req.body.thumbnail
            try{
                await articles_db_manager.create_article(user, title, content, thumbnail)
                res.status(200).send("article created")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.post('/api/articles/:article_id/comments', async (req, res) => {
            var article_id = req.params.article_id
            var user = debug_utils.get_user_by_request(req)
            var content = req.body.content
            try{
                await articles_db_manager.create_comment(article_id, user, content)
                res.status(200).send("comment created")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.post('/api/articles/:article_id/comments/:comment_id/reply', async (req, res) => {
            var article_id = req.params.article_id
            var comment_id = req.params.comment_id
            var user = debug_utils.get_user_by_request(req)
            var content = req.body.content
            try{
                await articles_db_manager.reply_comment(comment_id, user, content)
                res.status(200).send("comment replied")
                return res.end()
            }
            catch (exception){
                res.status(exception.code).send(exception.message)
                return res.end()
            }
        })

        app.delete('/api/articles/:article_id', async (req, res) => {
            var article_id = req.params.article_id
            var user = debug_utils.get_user_by_request(req)
            try{
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
            var comment_id = req.params.comment_id
            var user = debug_utils.get_user_by_request(req)
            try{
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