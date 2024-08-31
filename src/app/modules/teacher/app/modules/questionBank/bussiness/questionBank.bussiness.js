const { msg } = require("../../../../config/message");
const { isValid } = require("../../../middleware/validator.middleware");
const { Question } = require("../models/questionBank.model");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const create = async (user, body) => {
  if (!isValid(body.type)) throw "type is required";
  if (!isValid(body.difficulty)) throw "difficulty is required";
  if (!isValid(body.subject)) throw "subject is required";
  if (!isValid(body.category)) throw "category is required";
  if (!isValid(body.question)) throw "question is required";
  if (body.type == "multiple-choice") {
    if (body.options.length == 0) throw "options is required";
    if (!isValid(body.correctAnswer)) throw "correctAnswer is required";
  }
  body.createdBy = user._id;

  const createQue = await Question.create(body);
  return {
    msg: "question added successfully",
  };
};

const get = async (user, query, body) => {
  const { id } = query;
  let {
    type,
    difficulty,
    subject,
    category,
    tags,
    key,
    page,
    fromDate,
    toDate,
  } = body;

  if (isValid(id)) {
    if (!mongoose.isValidObjectId(id)) throw "invalid id";
    let question = await Question.findById(id);
    if (!question) question = {};
    return {
      msg: msg.success,
      result: question,
    };
  } else {
    const filter = { question: { $exists: true } };

    if (isValid(type)) filter.type = type;
    if (isValid(difficulty)) filter.difficulty = difficulty;
    if (isValid(subject)) filter.subject = subject;
    if (isValid(category)) filter.category = category;
    if (isValid(tags)) filter.tags = { $in: tags.split(",") };

    if (isValid(fromDate) && isValid(toDate)) {
      fromDate = new Date(fromDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(toDate);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: fromDate,
        $lte: toDate,
      };
    } else if (isValid(fromDate) && !isValid(toDate)) {
      fromDate = new Date(fromDate);
      fromDate.setHours(0, 0, 0, 0);
      filter.createdAt = {
        $gte: fromDate,
      };
    } else if (!isValid(fromDate) && isValid(toDate)) {
      toDate = new Date(toDate);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $lte: toDate,
      };
    }

    let pipeline = [];

    if (isValid(key)) {
      filter.$or = [
        { question: { $regex: key, $options: "i" } },
        { category: { $regex: key, $options: "i" } },
        { tags: { $in: key.split(",").map((tag) => new RegExp(tag, "i")) } },
      ];
    }

    pipeline.push({ $match: filter });

    if (isValid(page) && page > 0) {
      pipeline.push({ $skip: (page - 1) * 10 }, { $limit: 10 });
    }

    const questions = await Question.aggregate(pipeline);

    return {
      msg: msg.success,
      count: questions.length,
      result: questions,
    };
  }
};

const update = async (user, query, body) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  Object.keys(body).forEach((key) => {
    if (!isValid(body[key]) || body[key].length == 0) {
      delete body[key];
    }
  });

  const question = await Question.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );
  if (!question) throw "question not found";

  return {
    msg: msg.success,
  };
};

const deleteQue = async (user, query) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  let question = await Question.findByIdAndDelete(id);
  if (!question) throw "question not found";

  return {
    msg: msg.success,
  };
};

const exportQue = async (req, res) => {
  try {
    let body = req.body;
    const { type, difficulty, subject, category, tags, key, page } = body;

    const filter = { question: { $exists: true } };

    if (isValid(type)) filter.type = type;
    if (isValid(difficulty)) filter.difficulty = difficulty;
    if (isValid(subject)) filter.subject = subject;
    if (isValid(category)) filter.category = category;
    if (isValid(tags)) filter.tags = { $in: tags.split(",") };

    let pipeline = [];

    if (isValid(key)) {
      filter.$or = [
        { question: { $regex: key, $options: "i" } },
        { category: { $regex: key, $options: "i" } },
        { tags: { $in: key.split(",").map((tag) => new RegExp(tag, "i")) } },
      ];
    }

    pipeline.push({ $match: filter });

    if (isValid(page) && page > 0) {
      pipeline.push({ $skip: (page - 1) * 10 }, { $limit: 10 });
    }

    let project = {
      question: 1,
      type: 1,
      difficulty: 1,
      subject: 1,
      category: 1,
      tags: 1,
      options: 1,
      correctAnswer: 1,
      _id: 0,
    };

    pipeline.push({ $project: project });

    const questions = await Question.aggregate(pipeline);

    const fileName = "exported_data.json";
    const filePath = path.join(__dirname, fileName);

    fs.writeFile(filePath, JSON.stringify(questions, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Error writing file" });
      }

      res.download(filePath, (err) => {
        if (err) {
          res.status(500).json({ message: "Error downloading file" });
        }

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting exported file", err);
          }
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const importQue = async (req, res) => {
  try {
    const { questionList } = req.body;
    if (questionList.length === 0)
      return res.status(400).send({ msg: "No questions found" });
    let queList = await Question.insertMany(questionList);
    return res.status(201).send({ msg: "Questions imported successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  create,
  get,
  update,
  deleteQue,
  exportQue,
  importQue,
};
