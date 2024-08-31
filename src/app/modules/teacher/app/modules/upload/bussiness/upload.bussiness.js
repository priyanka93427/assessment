const mongoose = require("mongoose");
const sharp = require("sharp");
const { Upload } = require("../models/upload.model");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const file = req.file;
    const processedImageBuffer = await sharp(file.buffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64Image = processedImageBuffer.toString("base64");

    let data = new Upload({
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: processedImageBuffer.length,
      buffer: base64Image,
    });

    data.url = `/api/upload/openFile/${data._id}`;
    data = await data.save();

    return res.status(200).json({
      msg: "File uploaded successfully",
      result: {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: processedImageBuffer.length,
        url: data.url,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

const openFile = async (req, res) => {
  try {
    const imageId = req.params.id;
    const data = await Upload.findById(imageId);
    if (!data) return res.status(404).json({ msg: "Image not found" });
    const base64Image = data.buffer;

    if (!base64Image) {
      return res.status(404).json({ msg: "Image not found" });
    }

    const imageBuffer = Buffer.from(base64Image, "base64");
    res.set("Content-Type", `${data.mimetype}`);
    return res.send(imageBuffer);
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = {
  uploadImage,
  openFile,
};
