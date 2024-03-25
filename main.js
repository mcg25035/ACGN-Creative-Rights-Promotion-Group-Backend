const sqlite3 = require("sqlite3")
const {open} = require("sqlite")
const db = new sqlite3.Database("data")
const db_utils = require("./db_utils")
const express = require("express")
const session = require("express-session")
const cors = require("cors")
const app = express()
app.use(express.json())

app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(session({
    secret: "test",
    resave: false,
    cookie: {}
}))




const articles_db = require("./articles_db")
const articles_api = require("./articles_api")
const users_db = require("./users_db")
const users_api = require("./users_api")




// app.post('/api/articles')





async function main(){
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    })

    const articles_db_manager = new articles_db()
    await articles_db_manager.init(db)

    const users_db_manager = new users_db()
    await users_db_manager.init(db)
    
    

    articles_api.register(app, articles_db_manager)
    users_api.register(app, users_db_manager)
    
    app.listen(3000, ()=>{
        console.log("Server is running on port 3000")
    })
}


main()