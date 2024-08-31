const {
  create,
  get,
  update,
  deleteQue,
  exportQue,
  importQue,
} = require("../bussiness/questionBank.bussiness");

exports.create = async (req) => await create(req.user, req.body);
exports.get = async (req) => await get(req.user, req.query, req.body);
exports.update = async (req) => await update(req.user, req.query, req.body);
exports.deleteQue = async (req) => await deleteQue(req.user, req.query);
exports.exportQue = async (req, res) => await exportQue(req, res);
exports.importQue = async (req, res) => await importQue(req, res);
