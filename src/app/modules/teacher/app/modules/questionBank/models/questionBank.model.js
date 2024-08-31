const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    type: {
      type: String,
      enum: ["multiple-choice", "short-answer", "essay"],
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      trim: true,
    },
    image: { type: String, trim: true },
    video: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    tags: [String],
    options: [String], 
    correctAnswer: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", QuestionSchema);
module.exports = { Question };
