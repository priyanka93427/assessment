const express = require("express");
const cors = require("cors");
const http = require('http');
const bodyParser = require("body-parser")
const { env } = require("./environment/environment")
const path = require('path')
const routes = require("./route")
const session = require('express-session');
const mongoose = require('./app/db/mongoose')
const port = process.env.PORT || 3000
const app = express();
const server = http.createServer(app);
app.use(cors('*'));

app.use(bodyParser.json({ limit: '500mb' })); 
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'GOCSPXUWo9u84Dbqw4t' 
}));

app.get("/", (req, res) => {
    try {
        return res.status(200).send("student server is running")
    } catch (error) {
        return res.status(500).send(error.message)
    }
})

//Mapping all modules path and path-handler
routes.map(route => {
    app.use(route.path, route.handler);
});

server.listen(port, () => {
    console.log(`student🧒 server is running on port ${port}`)
})

module.exports = { server }
