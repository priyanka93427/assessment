const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const { env } = require("./src/app/modules/teacher/environment/environment");
const teacherRoutes = require("./src/app/modules/teacher/route");
const studentRoutes = require("./src/app/modules/student/route");
const mongoose = require("./src/app/modules/teacher/app/db/mongoose");
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
    return res.status(200).send("server is running");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

//Mapping all modules path and path-handler
teacherRoutes.map((route) => {
  app.use(route.path, route.handler);
});

studentRoutes.map((route) => {
  app.use(route.path, route.handler);
});

server.listen(port, () => {
  console.log(`teacher server is running on port ${port}`);
});

module.exports = { server };
