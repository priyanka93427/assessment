const {
  get,
  getById,
  start,
  submit,
  viewReport,
  downloadReportInPdf,
} = require("../bussiness/studentAssessment.bussiness");

exports.get = async (req) => await get(req.user, req.query, req.body);
exports.getById = async (req) => await getById(req.user, req.query);
exports.start = async (req) => await start(req.user, req.query);
exports.submit = async (req) => await submit(req.user, req.query, req.body);
exports.viewReport = async (req) => await viewReport(req.user, req.query);
exports.downloadReportInPdf = async (req, res) =>
  await downloadReportInPdf(req, res);
