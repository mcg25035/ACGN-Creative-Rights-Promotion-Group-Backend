class debug_utils {
    /**
    * @param {express.Request} req 
    */
    static get_user_by_request(req){
        return req.query.user
    }
}

module.exports = debug_utils