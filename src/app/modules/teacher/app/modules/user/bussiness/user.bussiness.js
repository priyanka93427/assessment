const { msg } = require("../../../../config/message");
const { generateAuthToken } = require("../../../util/generate.token");
const { isValid } = require("../../../middleware/validator.middleware");
const { sendSmsFromSpringedge } = require("../../../util/springedge");

const { User } = require("../models/user.model");
const CryptoJS = require("crypto-js");

let validator = require("validator");
const mongoose = require("mongoose");

const sendOTP = async (user, body) => {
  let { name, email, phone, countryCode, password, roleId } = body;

  if (!isValid(name)) throw "name is required";
  if (!isValid(countryCode)) throw "countryCode is required";

  let check = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  if (!check.test(password)) {
    throw "Password must be at least 6 characters long, include one letter, one number, and one special character.";
  }

  if (!validator.isEmail(email)) throw msg.invalidEmail;
  if (!validator.isMobilePhone(phone)) throw msg.invalidPhone;

  const foundUser = await User.findOne({
    $or: [{ phone: phone }, { email: email }],
  });

  if (foundUser) throw msg.duplicateEmailOrPhone;

  if (roleId == 1) body.role = "teacher";
  else body.role = "student";

  let OTP = Math.floor(1000 + Math.random() * 999).toString();
  let ciphertext = CryptoJS.AES.encrypt(
    OTP,
    process.env.crypto_secret_key
  ).toString();

  body.password = CryptoJS.AES.encrypt(
    password,
    process.env.crypto_secret_key
  ).toString();

  let phoneNumber = `${countryCode}${phone}`;
  let abc = await sendSmsFromSpringedge(
    phoneNumber,
    `Please enter this OTP ${OTP} . This code is valid for 10 minutes`,
    OTP
  );
  console.log(abc, "===============");
  let newDate = new Date();
  body.otp = ciphertext;
  body.otpDate = newDate;

  const createuser = await User.create(body);

  return {
    msg: "user created successfully",
  };
};

const verifyOTP = async (user, body) => {
  const { phone, otp } = body;

  if (!isValid(phone)) throw "phone is required";
  if (!isValid(otp)) throw "Please provide otp";

  let foundUser = await User.findOne({ phone: phone });
  if (!foundUser) throw msg.userNotFound;

  let date1 = foundUser.otpDate;
  let date1Time = date1.getTime();
  let date2 = new Date();
  let date2Time = date2.getTime();
  let minutes = (date2Time - date1Time) / (1000 * 60);
  if (minutes > 10) {
    throw msg.expireOtp;
  }

  const bytes = CryptoJS.AES.decrypt(
    foundUser.otp,
    process.env.crypto_secret_key
  );
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  if (originalText == otp) {
    foundUser.isVerified = true;
    res = await foundUser.save();

    return {
      msg: "OTP verified successfully",
    };
  } else {
    throw msg.incorrectOTP;
  }
};

const login = async (user, body) => {
  const { emailOrPhone, password } = body;

  if (!isValid(emailOrPhone)) throw "Email or phone is required";
  if (!isValid(password)) throw "password is required";

  let foundUser = await User.findOne({
    $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    isDeleted: false,
  });
  if (!foundUser) throw msg.userNotFound;

  const bytes = CryptoJS.AES.decrypt(
    foundUser.password,
    process.env.crypto_secret_key
  );
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  if (originalText == password) {
    return {
      message: "ok",
      token: await generateAuthToken(foundUser),
    };
  } else {
    throw msg.invalidPassword;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  login,
};
