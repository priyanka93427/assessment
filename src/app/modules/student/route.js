const studentAssessment_routes = require("./app/modules/studentAssessment/routes/studentAssessment.route");

//All modules path and path-handler array
module.exports = [
  {
    path: "/api/student/assessment",
    handler: studentAssessment_routes
  },
]  