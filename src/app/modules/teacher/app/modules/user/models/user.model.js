const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    countryCode: { type: Number, required: true }, // 91
    otp: { type: String, required: true, trim: true },
    otpDate: { type: Date, required: true },
    isVerified: { type: Boolean, default: false },
    password: { type: String, required: true, trim: true },
    roleId: { type: Number, default: 0 }, // 0 for student and 1 for teacher
    role: { type: String, enum: ["teacher", "student"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = { User };
