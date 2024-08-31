const {
    sendOTP, verifyOTP, login,
} = require('../bussiness/user.bussiness')

exports.sendOTP = async (req) => await sendOTP(req.user, req.body);
exports.verifyOTP = async (req) => await verifyOTP(req.user, req.body);
exports.login = async (req) => await login(req.user, req.body)