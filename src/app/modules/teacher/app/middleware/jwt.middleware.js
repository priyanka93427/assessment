const { User } = require("../modules/user/models/user.model");
const { msg } = require("../../config/message");
const { errorHandler } = require("../helpers/errorHandling.helper");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const secret = process.env.secret_token;

//User authentication
exports.authenticate = async (req, res, next) => {
  try {
    const auth = req.header("Authorization");
    if (!auth) throw msg.unauthorisedRequest;
    const token = auth.substr(auth.indexOf(" ") + 1);
    let decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);
    if (!user || user.roleId != 1 || user.isDeleted == true) throw msg.unauthorisedRequest;
    req.user = user;
    return next();
  } catch (err) {
    const error = errorHandler(err, 401);
    return res.status(error.status).send(error);
  }
};
