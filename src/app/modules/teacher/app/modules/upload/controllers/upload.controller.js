const {
  uploadImage,
  openFile,
} = require("../bussiness/upload.bussiness");

exports.uploadImage = async (req, res) => await uploadImage(req, res);
exports.openFile = async (req, res) => await openFile(req, res);
