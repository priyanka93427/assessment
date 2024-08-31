let express = require("express");
let router = express.Router();
const { wrapAsync } = require("../../../helpers/router.helper");
const { authenticate } = require("../../../middleware/jwt.middleware");

const {
  create,
  get,
  update,
  deleteQue,
  exportQue,
  importQue,
} = require("../controllers/questionBank.controller");

router.post("/create", authenticate, wrapAsync(create));
router.post("/get", authenticate, wrapAsync(get));
router.put("/update", authenticate, wrapAsync(update));
router.delete("/deleteQue", authenticate, wrapAsync(deleteQue));
router.post("/exportQue", authenticate, exportQue);
router.post("/importQue", authenticate, importQue);

module.exports = router;
