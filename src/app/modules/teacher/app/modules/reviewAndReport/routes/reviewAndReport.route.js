let express = require("express");
let router = express.Router();
const { wrapAsync } = require("../../../helpers/router.helper");
const { authenticate } = require("../../../middleware/jwt.middleware");

const {
  allAssessment,
  allSubmission,
  studentReport,
  checkAssessment,
  downloadAllReport,
} = require("../controllers/reviewAndReport.controller");

router.get("/allAssessment", authenticate, wrapAsync(allAssessment));
router.get("/allSubmission", authenticate, wrapAsync(allSubmission));
router.get("/studentReport", authenticate, wrapAsync(studentReport));
router.put("/checkAssessment", authenticate, wrapAsync(checkAssessment));
router.get("/downloadAllReport", authenticate, downloadAllReport);

module.exports = router;
