const { msg } = require("../../../../config/message");
const { isValid } = require("../../../middleware/validator.middleware");
const { Assessment } = require("../../assessment/models/assessment.model");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const {
  StudentAssessment,
} = require("../../../../../student/app/modules/studentAssessment/models/studentAssessment.model");

const allAssessment = async (user, query) => {
  const assessments = await Assessment.aggregate([
    {
      $lookup: {
        from: "studentassessments",
        localField: "_id",
        foreignField: "assessmentId",
        as: "submissions",
      },
    },
    {
      $addFields: {
        totalstudentsubmit: { $size: "$submissions" },
      },
    },
    {
      $project: {
        title: 1,
        type: 1,
        questionType: 1,
        timeLimit: 1,
        attemptsAllowed: 1,
        totalMarks: 1,
        passingMarks: 1,
        submissionDate: 1,
        totalstudentsubmit: 1,
      },
    },
  ]);

  return {
    msg: msg.success,
    result: assessments,
  };
};

const allSubmission = async (user, query) => {
  const { id } = query;

  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  const result = await StudentAssessment.aggregate([
    { $match: { assessmentId: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        _id: 1,
        studentName: "$studentInfo.name",
        studentId: "$studentInfo._id",
        assessmentId: "$assessmentId",
        attemptsByMe: 1,
        attemptsLeft: 1,
        submissionLogs: {
          $map: {
            input: "$submissionLogs",
            as: "log",
            in: {
              grade: "$$log.grade",
              obtainedMarks: "$$log.obtainedMarks",
              timeTaken: "$$log.timeTaken",
              submitDate: "$$log.submitDate",
              attemptsIndex: "$$log.attemptsIndex",
              correct: "$$log.correct",
              wrong: "$$log.wrong",
              notAttempted: "$$log.notAttempted",
              feedback: "$$log.feedback",
              _id: "$$log._id",
            },
          },
        },
      },
    },
  ]);

  return {
    msg: "ok",
    result: result,
  };
};

const studentReport = async (user, query) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "submission id is invalid";

  let studentAssessment = await StudentAssessment.findById(id).populate(
    "assessmentId"
  );

  if (!studentAssessment) studentAssessment = {};

  return {
    msg: msg.success,
    result: studentAssessment,
  };
};

const checkAssessment = async (user, query, body) => {
  const { id, attemptsIndex } = query;
  const { answer, obtainedMarks, feedback } = body;
  if (!mongoose.isValidObjectId(id)) throw "submission id is invalid";
  if (!isValid(attemptsIndex) || attemptsIndex < 1)
    throw "attempts index is invalid";

  let studentAssessment = await StudentAssessment.findById(id);

  if (!studentAssessment) throw "submission not found";

  let attemptsIndexData = studentAssessment.submissionLogs[attemptsIndex - 1];
  if (!attemptsIndexData) throw "attempts not found";

  if (isValid(feedback)) attemptsIndexData.feedback = feedback;
  if (isValid(obtainedMarks)) attemptsIndexData.obtainedMarks = obtainedMarks;

  let studentAnswer = attemptsIndexData.answer;

  let correct = 0;
  let wrong = 0;
  let notAttempted = 0;

  for (let i = 0; i < studentAnswer.length; i++) {
    if (studentAnswer[i]._id == answer[i]._id) {
      if (isValid(answer[i].correctAnswer))
        studentAnswer[i].correctAnswer = answer[i].correctAnswer;
      if (isValid(answer[i].obtainedPerQueMarks))
        studentAnswer[i].obtainedPerQueMarks = answer[i].obtainedPerQueMarks;
      if (isValid(answer[i].feedback))
        studentAnswer[i].feedback = answer[i].feedback;
      if (isValid(answer[i].status)) studentAnswer[i].status = answer[i].status;
      if (isValid(answer[i].grade)) studentAnswer[i].grade = answer[i].grade;

      if (answer[i].status == "correct" || studentAnswer[i].status == "correct")
        correct++;
      else if (
        answer[i].status == "wrong" ||
        studentAnswer[i].status == "wrong"
      )
        wrong++;
      else notAttempted++;
    }
  }

  attemptsIndexData.correct = correct;
  attemptsIndexData.wrong = wrong;
  attemptsIndexData.notAttempted = notAttempted;
  attemptsIndexData.answer = studentAnswer;
  attemptsIndexData.checkBy = user._id;
  attemptsIndexData.checkDate = Date.now();
  studentAssessment.submissionLogs[attemptsIndex - 1] = attemptsIndexData;
  await studentAssessment.save();
  return {
    msg: msg.success,
  };
};

const downloadAllReport = async (req, res) => {
  try {
    const { id } = req.query;

    if (!mongoose.isValidObjectId(id)) throw "invalid assessment id";

    const result = await StudentAssessment.aggregate([
      { $match: { assessmentId: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
      {
        $lookup: {
          from: "assessments",
          localField: "assessmentId",
          foreignField: "_id",
          as: "assessmentId",
        },
      },
      { $unwind: "$assessmentId" },
      {
        $project: {
          _id: 1,
          studentName: "$studentInfo.name",
          studentId: "$studentInfo._id",
          assessmentId: {
            title: 1,
            type: 1,
            questionType: 1,
            timeLimit: 1,
            attemptsAllowed: 1,
            totalMarks: 1,
            passingMarks: 1,
            submissionDate: 1,
            totalstudentsubmit: 1,
          },
          attemptsByMe: 1,
          attemptsLeft: 1,
          submissionLogs: {
            $map: {
              input: "$submissionLogs",
              as: "log",
              in: {
                grade: "$$log.grade",
                obtainedMarks: "$$log.obtainedMarks",
                timeTaken: "$$log.timeTaken",
                submitDate: "$$log.submitDate",
                attemptsIndex: "$$log.attemptsIndex",
                correct: "$$log.correct",
                wrong: "$$log.wrong",
                notAttempted: "$$log.notAttempted",
                feedback: "$$log.feedback",
                _id: "$$log._id",
              },
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(400).json({ msg: "student submission not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=assessment-${id}.pdf`
    );

    await generatePDF(result, res);
  } catch (error) {
    return res.status(500).send({ msg: error.message });
  }
};

const generatePDF = (result, res) => {
  try {
    const doc = new PDFDocument();

    doc.pipe(res);
    let assessment = result[0].assessmentId;

    doc.fontSize(20).text(assessment.title, { align: "center" });

    doc.moveDown();
    doc.fontSize(14).text(`Type: ${assessment.type}`);
    doc.text(`Question Type: ${assessment.questionType}`);
    doc.text(`Time Limit: ${assessment.timeLimit} minutes`);
    doc.text(`Attempts Allowed: ${assessment.attemptsAllowed}`);
    doc.text(`Total Marks: ${assessment.totalMarks}`);
    doc.text(`Passing Marks: ${assessment.passingMarks}`);
    doc.text(`Submission Date: ${assessment.submissionDate}`);

    doc.moveDown();
    result.forEach((student, index) => {
      doc.fontSize(14).text(`Student ${index + 1}:`);
      doc.fontSize(12).text(`Name: ${student.studentName}`);
      doc.text(`Id: ${student.studentId}`);
      doc.text(`Attempts: ${student.attemptsByMe}`);
      doc.text(`Attempts Left: ${student.attemptsLeft}`);
      doc.moveDown();
      student.submissionLogs.forEach((log, index) => {
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
    });

    doc.end();
  } catch (error) {
    console.log({ error: error.message });
  }
};

module.exports = {
  allAssessment,
  allSubmission,
  studentReport,
  checkAssessment,
  downloadAllReport,
};
