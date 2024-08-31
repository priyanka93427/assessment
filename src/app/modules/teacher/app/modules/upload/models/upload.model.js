const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    buffer: { type: String, trim: true, required: true },
    url: { type: String, trim: true, required: true },
    originalName: { type: String, trim: true },
    mimetype: { type: String, trim: true },
    size: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Upload = mongoose.model("upload", uploadSchema);
module.exports = { Upload };
