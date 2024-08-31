let express = require("express");
let router = express.Router();
const { wrapAsync } = require("../../../helpers/router.helper");
const { authenticate } = require("../../../middleware/jwt.middleware");

const {
  get,
  getById,
  start,
  submit,
  viewReport,
  downloadReportInPdf
} = require("../controllers/studentAssessment.controller");

router.post("/get", authenticate, wrapAsync(get));
router.get("/getById", authenticate, wrapAsync(getById));
router.get("/start", authenticate, wrapAsync(start));
router.post("/submit", authenticate, wrapAsync(submit));
router.get("/viewReport", authenticate, wrapAsync(viewReport));
router.get("/downloadReportInPdf", authenticate, wrapAsync(downloadReportInPdf));

module.exports = router;
