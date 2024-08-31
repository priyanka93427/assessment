const User_routes = require("./app/modules/user/routes/user.route");
const QuestionBank_routes = require("./app/modules/questionBank/routes/questionBank.route");
const Assessment_routes = require("./app/modules/assessment/routes/assessment.route");
const reviewAndReport_routes = require("./app/modules/reviewAndReport/routes/reviewAndReport.route");
const upload_routes = require("./app/modules/upload/routes/upload.route");

//All modules path and path-handler array
module.exports = [
  {
    path: "/api/user",
    handler: User_routes,
  },
  {
    path: "/api/question",
    handler: QuestionBank_routes,
  },
  {
    path: "/api/assessment",
    handler: Assessment_routes,
  },
  {
    path: "/api/reviewAndReport",
    handler: reviewAndReport_routes,
  },
  {
    path: "/api/upload",
    handler: upload_routes,
  },
];
