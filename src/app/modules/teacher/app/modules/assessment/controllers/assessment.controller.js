const {
  create,
  published,
  get,
  update,
  softDelete,
  restore,
  hardDelete,
} = require("../bussiness/assessment.bussiness");

exports.create = async (req) => await create(req.user, req.query, req.body);
exports.published = async (req) => await published(req.user, req.query, req.body);
exports.get = async (req) => await get(req.user, req.query, req.body);
exports.update = async (req) => await update(req.user, req.query, req.body);
exports.softDelete = async (req) => await softDelete(req.user, req.query);
exports.restore = async (req) => await restore(req.user, req.query, req.body);
exports.hardDelete = async (req) => await hardDelete(req.user, req.query, req.body);
