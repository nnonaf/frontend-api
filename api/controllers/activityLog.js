'use strict';

const axios = require('axios');
const { get } = require('lodash');

const API_URL = process.env.API_URL;

module.exports = {
  getActivityLogs  
}

async function getActivityLogs(req, res) {
  let query = req.query;
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/activityLogs`,
      params: query,
      headers: {
        authorization: get(req, 'headers.authorization', '')
      }
    });
    res.status(result.status).json(result.data || []);
  } catch (error) {
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}