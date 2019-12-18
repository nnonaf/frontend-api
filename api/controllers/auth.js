'use strict';

const axios = require('axios');
const { get } = require('lodash');
const twoFactor = require('node-2fa');

var ActivityLog = require('../data/activityLog');

const API_URL = process.env.API_URL;

module.exports = {  
  login
}

async function login(req, res) {
  try {
    // get auth
    let result = await axios({
      method: 'POST',
      url: `${API_URL}/login`,
      data: req.body
    });
    let user = result.data;
    ActivityLog.createActivityLog({
      user: user._id,
      key: 'login',
      userAgent: req.useragent,
      location: req.clientIp,
      description: `logged in from ${get(req, 'useragent.browser')} ${get(req, 'useragent.os')}`
    });
    res.status(result.status).json(result.data || {});
  } catch (error) {
    console.log(error)
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}