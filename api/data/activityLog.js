var { ActivityLog } = require('../models');
var { generateSearchQuery } = require('./utils');

var createActivityLog = async (data) => {
  try {
    let log = new ActivityLog(data);
    return await log.save();
  } catch (error) {
    throw error;
  }
}

var getActivityLogs = async (cond) => {
  try {
    return await generateSearchQuery(ActivityLog, cond);
  } catch (error) {
    throw error;
  }
};

/**
 * Finds a single log
 * @param {String|Object} cond log id or query
 */
var getActivityLog = async (cond) => {
  try {
    switch (typeof cond) {
      case 'string':
        return await ActivityLog.findById(cond);
      default:
        return await ActivityLog.findOne(cond);
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getActivityLog,
  getActivityLogs,
  createActivityLog  
}