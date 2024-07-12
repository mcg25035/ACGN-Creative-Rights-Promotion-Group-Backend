const uuid = require("uuid")

class users_session{
    static sessions = {}
    
    /**
     * @param {string} user_id 
     * @returns {string}
     */
    static create_session(user_id){
        var session_id = uuid.v4()
        while (users_session.sessions[session_id]) session_id = uuid.v4()

        users_session.sessions[session_id] = {user_id: user_id, expired: setTimeout(()=>{
            delete users_session.sessions[session_id]
        }, 1000*60*60*12)}

        return session_id
    }

    static delete_session(session_id){
        delete users_session.sessions[session_id]
    }

    static delete_user_session(user_id){
        for (var session_id in users_session.sessions){
            if (users_session.sessions[session_id].user_id != user_id) continue;
            this.delete_session(session_id)
        }
    }

    /**
     * @param {string} session_id 
     */
    static update_session(session_id){
        if (users_session.sessions[session_id]){
            clearTimeout(users_session.sessions[session_id].expired)
            users_session.sessions[session_id].expired = setTimeout(()=>{
                delete users_session.sessions[session_id]
            }, 1000*60*60*12)
        }
    }

    /**
     * @param {string} session_id 
     * @returns 
     */
    static get_user_from_session(session_id){
        if (users_session.sessions[session_id]){
            return users_session.sessions[session_id].user_id
        }
        return null
    }

    
}

module.exports = users_session