const {
  allAssessment,
  allSubmission,
  studentReport,
  checkAssessment,
  downloadAllReport,
} = require("../bussiness/reviewAndReport.bussiness");

exports.allAssessment = async (req) => await allAssessment(req.user, req.query);
exports.allSubmission = async (req) => await allSubmission(req.user, req.query);
exports.studentReport = async (req) => await studentReport(req.user, req.query, req.body);
exports.checkAssessment = async (req) => await checkAssessment(req.user, req.query, req.body);
exports.downloadAllReport = async (req, res) => await downloadAllReport(req, res);