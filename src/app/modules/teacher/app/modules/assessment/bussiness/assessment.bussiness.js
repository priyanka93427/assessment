const { msg } = require("../../../../config/message");
const { isValid } = require("../../../middleware/validator.middleware");
const { Assessment } = require("../models/assessment.model");
const mongoose = require("mongoose");

const create = async (user, query, body) => {
  if (!isValid(body.title)) throw "title is required";
  if (!isValid(body.type)) throw "type is required";
  if (!isValid(body.questionType)) throw "questionType is required";
  if (body.questions.length == 0) throw "questions is required";
  if (body.instructions.length == 0) throw "instructions is required";
  if (!isValid(body.timeLimit)) throw "timeLimit is required";
  if (!isValid(body.attemptsAllowed)) throw "attemptsAllowed is required";
  if (!isValid(body.totalMarks)) throw "totalMarks is required";
  if (!isValid(body.passingMarks)) throw "passingMarks is required";
  if (!isValid(body.submissionDate)) throw "submissionDate is required";
  if (isValid(body.status) && body.status == "published")
    body.publishedDate = new Date();

  body.createdBy = user._id;

  const assessment = await Assessment.create(body);
  return {
    msg: "assessment created successfully",
  };
};

const get = async (user, query, body) => {
  const { id, page } = query;
  let {
    title,
    type,
    questionType,
    timeLimit,
    attemptsAllowed,
    totalMarks,
    passingMarks,
    status = "published",
    isDeleted = false,
    key,
    fromDate,
    toDate,
  } = body;

  if (isValid(id)) {
    if (!mongoose.isValidObjectId(id)) throw "invalid id";
    let assessment = await Assessment.findById(id).populate(
      "questions.questionBankId",
      "question options correctAnswer"
    );
    if (!assessment) assessment = {};
    return {
      msg: msg.success,
      result: assessment,
    };
  } else {
    const filter = { questions: { $exists: true } };

    if (isValid(type)) filter.type = type;
    if (isValid(title)) filter.title = title;
    if (isValid(questionType)) filter.questionType = questionType;
    if (isValid(timeLimit)) filter.timeLimit = timeLimit;
    if (isValid(attemptsAllowed)) filter.attemptsAllowed = attemptsAllowed;
    if (isValid(totalMarks)) filter.totalMarks = totalMarks;
    if (isValid(passingMarks)) filter.passingMarks = passingMarks;
    if (isValid(status)) filter.status = status;
    if (isValid(isDeleted)) filter.isDeleted = isDeleted;

    let pipeline = [];

    if (isValid(key)) {
      filter.$or = [
        { type: { $regex: key, $options: "i" } },
        { title: { $regex: key, $options: "i" } },
        { questionType: { $regex: key, $options: "i" } },
      ];
    }

    if (isValid(fromDate) && isValid(toDate)) {
      fromDate = new Date(fromDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(toDate);
      toDate.setHours(23, 59, 59, 999);
      filter.publishedDate = {
        $gte: fromDate,
        $lte: toDate,
      };
    } else if (isValid(fromDate) && !isValid(toDate)) {
      fromDate = new Date(fromDate);
      fromDate.setHours(0, 0, 0, 0);
      filter.publishedDate = {
        $gte: fromDate,
      };
    } else if (!isValid(fromDate) && isValid(toDate)) {
      toDate = new Date(toDate);
      toDate.setHours(23, 59, 59, 999);
      filter.publishedDate = {
        $lte: toDate,
      };
    }

    pipeline.push({ $match: filter });

    let addfield = {
      $addFields: {
        publishedDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$publishedDate" },
        },
      },
    };

    pipeline.push(addfield);

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
  }
};

const published = async (user, query, body) => {
  const { ids } = body;

  let assessment = await Assessment.updateMany(
    { _id: { $in: ids }, isDeleted: false },
    { $set: { status: "published", publishedDate: new Date() } }
  );

  return {
    msg: msg.success,
  };
};

const update = async (user, query, body) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  Object.keys(body).forEach((key) => {
    if (!isValid(body[key]) || body[key].length == 0) {
      delete body[key];
    }
  });

  const assessment = await Assessment.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: body },
    { new: true }
  );
  if (!assessment) throw "assessment not found";

  return {
    msg: msg.success,
  };
};

const softDelete = async (user, query) => {
  const { id } = query;
  if (!mongoose.isValidObjectId(id)) throw "invalid id";

  let assessment = await Assessment.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!assessment) throw "assessment not found";

  return {
    msg: msg.success,
  };
};

const restore = async (user, query, body) => {
  const { ids } = body;

  let assessment = await Assessment.updateMany(
    { _id: { $in: ids }, isDeleted: true },
    { $set: { isDeleted: false } }
  );

  return {
    msg: msg.success,
  };
};

const hardDelete = async (user, query, body) => {
  const { ids } = body;

  let assessment = await Assessment.deleteMany({ _id: { $in: ids } });

  return {
    msg: msg.success,
    result: assessment,
  };
};

module.exports = {
  create,
  published,
  get,
  update,
  softDelete,
  restore,
  hardDelete,
};
