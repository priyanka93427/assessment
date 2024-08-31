const message = require("../../config/message").msg;

exports.errorHandler = (e, status = 400) => {
  let errorMsg, msg, err;
  if (typeof e != "object") {
    msg = e;
  } else if (e.msg) {
    err = e;
  } else if (e.details) {
    // in case joi throws error
    err = e.details[0].message.replaceAll('"', "");
    msg = "invalid body or query parameter";
  } else {
    err = e.message;
    if (err.includes("email_1 dup")) {
      err = message.duplicateEmail;
      msg = message.duplicateEmail;
    } else if (err.includes("phone_1 dup")) {
      err = message.duplicatePhone;
      msg = message.duplicatePhone;
    } else if (err.includes("valid email")) {
      msg = e.message;
    } else if (err.includes("`password` is required")) {
      msg = message.passwordRequired;
    } else if (err.includes("not a valid email")) {
      msg = message.invalidEmail;
    } else if (err.includes("undefined") || err.includes("null")) {
      msg = message.serverError;
    } else if (e.code == 11000) {
      msg = e.message;
    }
  }

  errorMsg = {
    error: err || msg || message.serverError,
    body: msg || message.serverError,
    status: status,
  };
  return errorMsg;
};
