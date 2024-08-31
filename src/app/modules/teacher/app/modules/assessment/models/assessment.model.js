const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  options: [String], 
  correctAnswer: { type: String, trim: true },
  image: { type: String, trim: true },
  video: { type: String, trim: true },
  marks: { type: Number, trim: true, required: true },
  questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
});

const AssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["quiz", "assignment", "survey"],
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["multiple-choice", "short-answer", "essay"],
      required: true,
      trim: true,
    },
    questions: [QuestionSchema],
    instructions: [String],
    timeLimit: { type: Number, required: true }, // In minutes
    attemptsAllowed: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    submissionDate: { type: Date, required: true },
    publishedDate: { type: Date, required: true },
    courseContentLink: String,
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", AssessmentSchema);
module.exports = { Assessment };
