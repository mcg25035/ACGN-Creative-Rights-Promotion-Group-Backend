class debug_utils {
    static test_user_data = {
        "allow_bpgp": 0,
        "allow_post": 1,
        "allow_admin": 2,
        "codingbear": 2,
        "admin": 2,
        "codingbear2": 1,
        "codingbear4": 1,
        "codingbear3": 0
    }
    /**
    * @param {express.Request} req 
    */
    static get_user_by_request(req){
        return req.query.user
    }

    /**
     * @param {string} user_id
     * @param {string} user_id2
     */
    static permission_compare(user_id, user_id2){
        try{
            var user1_permission = this.test_user_data[user_id]
            var user2_permission = this.test_user_data[user_id2]
        }
        catch (exception){
            return -1
        }
        if (user1_permission > user2_permission) return 1
        else if (user1_permission == user2_permission) return 0
        else return -1
    }
}

module.exports = debug_utils