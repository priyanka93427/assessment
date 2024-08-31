let express = require("express");
let router = express.Router();
const { authenticate } = require("../../../middleware/jwt.middleware");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  uploadImage,
  openFile,
} = require("../controllers/upload.controller");

router.post("/uploadImage", authenticate, upload.single("file"), uploadImage);
router.get("/openFile/:id", openFile);

// note: I don't have an AWS certificate, so I use a database to store images.

module.exports = router;
