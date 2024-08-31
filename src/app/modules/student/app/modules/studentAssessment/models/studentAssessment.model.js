const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  options: [String], 
  correctAnswer: { type: String, trim: true },
  myAnswer: { type: String, trim: true },
  image: { type: String, trim: true },
  video: { type: String, trim: true },
  marks: { type: Number, trim: true },
  answerStatus: {
    type: String,
    trim: true,
    enum: ["attempted", "notAttempted"],
  },
  status: {
    type: String,
    trim: true,
    enum: ["correct", "wrong", "notAttempted"],
  },
  questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  obtainedPerQueMarks: { type: Number, trim: true },
  grade: { type: String, trim: true },
  feedback: { type: String, trim: true },
});

const allQuestion = new mongoose.Schema({
  answer: [QuestionSchema],
  grade: { type: String, trim: true },
  obtainedMarks: { type: Number },
  timeTaken: { type: Number, required: true }, // In minutes
  submitDate: { type: Date, default: new Date() },
  checkDate: { type: Date },
  attemptsIndex: { type: Number, default: 1 },
  correct: { type: Number },
  wrong: { type: Number },
  notAttempted: { type: Number },
  feedback: { type: String, trim: true },
  checkBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const studentAssessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    attemptsByMe: { type: Number, required: true },
    attemptsLeft: { type: Number, required: true },
    submissionLogs: [allQuestion],
  },
  { timestamps: true }
);

const StudentAssessment = mongoose.model(
  "Studentassessment",
  studentAssessmentSchema
);
module.exports = { StudentAssessment };
