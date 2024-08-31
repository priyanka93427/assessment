const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const { env } = require("./environment/environment");
const routes = require("./route");
const mongoose = require("./app/db/mongoose");
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
app.use(cors("*"));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  try {
    return res.status(200).send("teacher server is running");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

//Mapping all modules path and path-handler
routes.map((route) => {
  app.use(route.path, route.handler);
});

server.listen(port, () => {
  console.log(`teacher server is running on port ${port}`);
});

module.exports = { server };
