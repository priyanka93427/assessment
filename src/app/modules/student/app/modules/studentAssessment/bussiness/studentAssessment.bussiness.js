const { msg } = require("../../../../config/message");
const { isValid } = require("../../../middleware/validator.middleware");
const {
  Assessment,
} = require("../../../../../teacher/app/modules/assessment/models/assessment.model");
const { StudentAssessment } = require("../models/studentAssessment.model");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const get = async (user, query, body) => {
  const { page } = query;
  let { title, type, questionType, publishedDate, submissionDate, key } = body;

  const filter = { isDeleted: false, status: "published" };

  if (isValid(type)) filter.type = type;
  if (isValid(title)) filter.title = title;
  if (isValid(questionType)) filter.questionType = questionType;
  if (isValid(publishedDate)) filter.publishedDate = publishedDate;
  if (isValid(submissionDate)) filter.submissionDate = submissionDate;

  let pipeline = [];

  if (isValid(key)) {
    filter.$or = [
      { type: { $regex: key, $options: "i" } },
      { title: { $regex: key, $options: "i" } },
      { questionType: { $regex: key, $options: "i" } },
    ];
  }

  let addfield = {
    $addFields: {
      publishedDate: {
        $dateToString: { format: "%Y-%m-%d", date: "$publishedDate" },
      },
      submissionDate: {
        $dateToString: { format: "%Y-%m-%d", date: "$submissionDate" },
      },
    },
  };

  pipeline.push(addfield);

  pipeline.push({ $match: filter });

  const project = {
    $project: {
      title: 1,
      type: 1,
      questionType: 1,
      publishedDate: 1,
      submissionDate: 1,
    },
  };

  pipeline.push(project);

  const count = await Assessment.aggregate(pipeline);

  if (isValid(page) && page > 0) {
    pipeline.push({ $skip: (page - 1) * 10 }, { $limit: 10 });
  }

  const assessment = await Assessment.aggregate(pipeline);

  return {
    msg: msg.success,
    count: count.length,
    result: assessment,
  };
};

const getById = async (user, query) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  let assessment = await Assessment.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id), isDeleted: false } },
    {
      $addFields: {
        publishedDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$publishedDate" },
        },
        submissionDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$submissionDate" },
        },
        totalQuestion: {
          $size: "$questions",
        },
      },
    },
    {
      $project: {
        title: 1,
        type: 1,
        questionType: 1,
        publishedDate: 1,
        submissionDate: 1,
        instructions: 1,
        timeLimit: 1,
        attemptsAllowed: 1,
        totalMarks: 1,
        passingMarks: 1,
        totalQuestion: 1,
      },
    },
  ]);

  let studentAssessment = await StudentAssessment.findOne({
    assessmentId: id,
    studentId: user._id,
  }).select({ attemptsLeft: 1 });

  if (assessment.length == 0) assessment = {};
  else {
    assessment = assessment[0];
    let submissionDate = new Date(assessment.submissionDate);
    submissionDate.setHours(23, 59, 59, 999);
    let status;
    if (submissionDate < new Date() && studentAssessment) status = "submitted";
    else if (submissionDate < new Date() && !studentAssessment)
      status = "missed";
    else if (studentAssessment && studentAssessment.attemptsLeft == 0)
      status = "submitted";
    else status = "start";

    assessment.actionStatus = status;
  }

  return {
    msg: msg.success,
    result: assessment,
  };
};

const start = async (user, query) => {
  const { id } = query;

  let assessment = await Assessment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        status: "published",
      },
    },
    {
      $unwind: "$questions",
    },
    {
      $lookup: {
        from: "questions",
        localField: "questions.questionBankId",
        foreignField: "_id",
        as: "populatedQuestion",
      },
    },
    {
      $unwind: {
        path: "$populatedQuestion",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        question: {
          $ifNull: ["$populatedQuestion.question", "$questions.question"],
        },
        options: {
          $ifNull: ["$populatedQuestion.options", "$questions.options"],
        },
        marks: "$questions.marks",
        image: {
          $ifNull: ["$populatedQuestion.image", "$questions.image"],
        },
        video: {
          $ifNull: ["$populatedQuestion.video", "$questions.video"],
        },
        _id: "$questions._id",
        questionBankId: "$populatedQuestion._id",
      },
    },
  ]);

  return {
    msg: msg.success,
    result: assessment,
  };
};

const submit = async (user, query, body) => {
  const { id } = query;
  const { answer } = body;

  if (!mongoose.isValidObjectId(id)) throw "invalid id";
  let studentAssessment = await StudentAssessment.findOne({
    studentId: user._id,
    assessmentId: id,
  });

  if (studentAssessment) {
    if (studentAssessment.attemptsLeft === 0) throw "no more attempts left";
  }

  let assessment = await Assessment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        status: "published",
      },
    },
    {
      $unwind: "$questions",
    },
    {
      $lookup: {
        from: "questions",
        localField: "questions.questionBankId",
        foreignField: "_id",
        as: "populatedQuestion",
      },
    },
    {
      $unwind: {
        path: "$populatedQuestion",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        question: {
          $ifNull: ["$populatedQuestion.question", "$questions.question"],
        },
        options: {
          $ifNull: ["$populatedQuestion.options", "$questions.options"],
        },
        correctAnswer: {
          $ifNull: [
            "$populatedQuestion.correctAnswer",
            "$questions.correctAnswer",
          ],
        },
        marks: "$questions.marks",
        image: {
          $ifNull: ["$populatedQuestion.image", "$questions.image"],
        },
        video: {
          $ifNull: ["$populatedQuestion.video", "$questions.video"],
        },
        _id: "$questions._id",
        questionBankId: "$populatedQuestion._id",
        attemptsAllowed: "$attemptsAllowed",
        questionType: "$questionType",
      },
    },
  ]);

  if (assessment.length == 0) throw "assessment not found";

  let correct = 0;
  let wrong = 0;
  let notAttempted = 0;
  let obtainedMarks = 0;

  for (let i = 0; i < assessment.length; i++) {
    if (answer[i]._id == assessment[i]._id) {
      assessment[i].myAnswer = answer[i].myAnswer;
      assessment[i].answerStatus = answer[i].answerStatus;
      answer[i] = assessment[i];
      if (answer[i].questionType == "multiple-choice") {
        if (answer[i].answerStatus == "notAttempted") {
          answer[i].status = "notAttempted";
          answer[i].obtainedPerQueMarks = 0;
          answer[i].grade = "F";
          notAttempted += 1;
        } else if (answer[i].correctAnswer == answer[i].myAnswer) {
          answer[i].obtainedPerQueMarks = answer[i].marks;
          answer[i].grade = "A";
          answer[i].status = "correct";
          correct += 1;
          obtainedMarks += answer[i].marks;
        } else {
          answer[i].obtainedPerQueMarks = 0;
          answer[i].grade = "F";
          answer[i].status = "wrong";
          wrong += 1;
        }
      }
    }
  }

  let submitData = {
    answer: answer,
    submitDate: new Date(),
    timeTaken: body.timeTaken,
  };

  if (answer[0].questionType == "multiple-choice") {
    submitData.correct = correct;
    submitData.wrong = wrong;
    submitData.notAttempted = notAttempted;
    submitData.obtainedMarks = obtainedMarks;
  }

  if (studentAssessment) {
    studentAssessment.attemptsByMe = studentAssessment.attemptsByMe + 1;
    submitData.attemptsIndex = studentAssessment.attemptsByMe;
    studentAssessment.attemptsLeft =
      assessment[0].attemptsAllowed - studentAssessment.attemptsByMe;
    studentAssessment.submissionLogs.push(submitData);
    await studentAssessment.save();
  } else {
    submitData.attemptsIndex = 1;
    let studentData = {
      studentId: user._id,
      assessmentId: id,
      attemptsByMe: 1,
      attemptsLeft: assessment[0].attemptsAllowed - 1,
      submissionLogs: [submitData],
    };
    const create = await StudentAssessment.create(studentData);
  }

  return {
    msg: "assessment submitted successfully",
  };
};

const viewReport = async (user, query) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  let studentAssessment = await StudentAssessment.findOne({
    assessmentId: id,
    studentId: user._id,
  }).populate("assessmentId");

  if (!studentAssessment) studentAssessment = {};

  let assessment = await Assessment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        status: "published",
      },
    },
    {
      $unwind: "$questions",
    },
    {
      $lookup: {
        from: "questions",
        localField: "questions.questionBankId",
        foreignField: "_id",
        as: "populatedQuestion",
      },
    },
    {
      $unwind: {
        path: "$populatedQuestion",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        question: {
          $ifNull: ["$populatedQuestion.question", "$questions.question"],
        },
        options: {
          $ifNull: ["$populatedQuestion.options", "$questions.options"],
        },
        marks: "$questions.marks",
        image: {
          $ifNull: ["$populatedQuestion.image", "$questions.image"],
        },
        video: {
          $ifNull: ["$populatedQuestion.video", "$questions.video"],
        },
        correctAnswer: {
          $ifNull: [
            "$populatedQuestion.correctAnswer",
            "$questions.correctAnswer",
          ],
        },
        _id: "$questions._id",
        questionBankId: "$populatedQuestion._id",
      },
    },
  ]);

  return {
    msg: msg.success,
    result: studentAssessment,
    assessment: assessment,
  };
};

const downloadReportInPdf = async (req, res) => {
  try {
    const { id } = req.query;
    const user = req.user;

    if (!mongoose.isValidObjectId(id)) throw "Invalid ID";

    let studentAssessment = await StudentAssessment.findOne({
      assessmentId: id,
      studentId: user._id,
    }).populate("assessmentId");

    if (!studentAssessment) {
      return res
        .status(400)
        .json({ msg: "You have not submitted this assessment" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=assessment-${id}.pdf`
    );

    await generatePDF(studentAssessment, res);
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

const generatePDF = (assessment, res) => {
  try {
    const doc = new PDFDocument();

    doc.pipe(res);

    doc.fontSize(20).text(assessment.assessmentId.title, { align: "center" });

    doc.moveDown();
    doc.fontSize(14).text(`Type: ${assessment.assessmentId.type}`);
    doc.text(`Question Type: ${assessment.assessmentId.questionType}`);
    doc.text(`Time Limit: ${assessment.assessmentId.timeLimit} minutes`);
    doc.text(`Attempts Allowed: ${assessment.assessmentId.attemptsAllowed}`);
    doc.text(`Total Marks: ${assessment.assessmentId.totalMarks}`);
    doc.text(`Passing Marks: ${assessment.assessmentId.passingMarks}`);
    doc.text(`Submission Date: ${assessment.assessmentId.submissionDate}`);

    doc.moveDown();
    assessment.submissionLogs.forEach((log, index) => {
      doc.fontSize(14).text(`Attempt ${index + 1}:`);
      doc.fontSize(12).text(`Submission Date: ${log.submitDate}`);
      doc.text(`Time Taken: ${log.timeTaken} minutes`);
      doc.text(`Obtained Marks: ${log.obtainedMarks}`);
      doc.text(`Grade: ${log.grade}`);
      doc.text(`Correct Answers: ${log.correct}`);
      doc.text(`Wrong Answers: ${log.wrong}`);
      doc.text(`Not Attempted: ${log.notAttempted}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.log({ error: error.message });
  }
};

module.exports = {
  get,
  getById,
  start,
  submit,
  viewReport,
  downloadReportInPdf,
};
