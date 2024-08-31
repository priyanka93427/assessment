let express = require("express");
let router = express.Router();
const { wrapAsync } = require("../../../helpers/router.helper");
const { authenticate } = require("../../../middleware/jwt.middleware");

const {
  create,
  published,
  get,
  update,
  softDelete,
  restore,
  hardDelete,
} = require("../controllers/assessment.controller");

router.post("/create", authenticate, wrapAsync(create));
router.put("/published", authenticate, wrapAsync(published));
router.post("/get", authenticate, wrapAsync(get));
router.put("/update", authenticate, wrapAsync(update));
router.delete("/softDelete", authenticate, wrapAsync(softDelete));
router.put("/restore", authenticate, wrapAsync(restore));
router.delete("/hardDelete", authenticate, wrapAsync(hardDelete));

module.exports = router;
