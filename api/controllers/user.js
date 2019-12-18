'use strict';

const axios = require('axios');
const { get, first } = require('lodash');
const mail = require('../data/mail');
var md5 = require('md5');

const API_URL = process.env.API_URL;
const API_USER = process.env.API_USER;
const API_PASSWORD = process.env.API_PASSWORD;

const RECOVERY_URL = process.env.RECOVERY_URL;
const ON_RECOVERY_RESULT_URL = process.env.ON_RECOVERY_RESULT_URL;

const VERIFICATION_URL = process.env.VERIFICATION_URL;
const ON_VERIFICATION_SUCCESS_URL = process.env.ON_VERIFICATION_SUCCESS_URL;
const ON_VERIFICATION_FAILED_URL = process.env.ON_VERIFICATION_FAILED_URL;

module.exports = {
  createUser,
  updateUser,
  getUser,
  getUsers,  
  startRecovery,
  verification,
  updateRecovery
}

async function createUser(req, res) {
  let { email, password, others } = req.body;
  try {
    let result = await axios({
      method: 'POST',
      url: `${API_URL}/users`,
      data: {
        email, password, others
      },
      auth: {
        username: API_USER,
        password: API_PASSWORD
      }
    });
    let user = result.data;
    // send verification mail to new user
    let timestamp = Date.now();
    let emailBody = await mail.createMailBody('emailVerification', {
      email,
      password,
      name: user.userName,
      link: `${VERIFICATION_URL}?email=${email}&id=${user._id}&key=${md5(user._id + timestamp)}&timestamp=${timestamp}`
    });
    let emailResult = await mail.sendMail('Verify Email Address', '', user.email, emailBody);
    res.status(result.status).json(user || {});
  } catch (error) {
    console.log(error);
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}

async function updateUser(req, res) {
  let id = req.swagger.params.id.value;
  let update = req.body;
  try {
    let result = await axios({
      method: 'PUT',
      url: `${API_URL}/users/${id}`,
      data: update,
      headers: {
        authorization: get(req, 'headers.authorization', '')
      }
    });
    res.status(result.status).json(result.data || {});
  } catch (error) {
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}

async function getUser(req, res) {
  let id = req.swagger.params.id.value;
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users/${id}`,
      headers: {
        authorization: get(req, 'headers.authorization', '')
      }
    });
    res.status(result.status).json(result.data || {});
  } catch (error) {
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}

async function getUsers(req, res) {
  let query = req.query;
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users`,
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

async function verification(req, res) {
  let { id, email, key, timestamp } = req.query;
  if (md5(id + timestamp) !== key)
    return res.redirect(ON_VERIFICATION_FAILED_URL);
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users/${id}`,
      auth: {
        username: API_USER,
        password: API_PASSWORD
      }
    });
    let user = result.data;
    if (user.email === email) {
      await axios({
        method: 'PUT',
        url: `${API_URL}/users/${id}`,
        data: { verified: true },
        auth: {
          username: API_USER,
          password: API_PASSWORD
        }
      });
      res.redirect(ON_VERIFICATION_SUCCESS_URL);
    } else {
      res.redirect(ON_VERIFICATION_FAILED_URL);
    }
  } catch (error) {
    res.redirect(ON_VERIFICATION_FAILED_URL);
  }
}

async function startRecovery(req, res) {
  let { email } = req.body;
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users?email=${email}`,
      auth: {
        username: API_USER,
        password: API_PASSWORD
      }
    });
    let user = first(result.data);
    if (user) {
      let timestamp = Date.now();
      let emailBody = await mail.createMailBody('passwordRecovery', {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        link: `${RECOVERY_URL}?email=${user.email}&key=${md5(user._id + timestamp)}&timestamp=${timestamp}`
      });
      await mail.sendMail('Password Recovery', '', user.email, emailBody);
      res.json({ message: `Recovery mail has been sent to ${user.email}` })
    } else {
      res.status(500).json({ message: 'Error recovering password' });
    }
  } catch (error) {
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}

async function updateRecovery(req, res) {
  let { email, key, timestamp } = req.query;
  // link should be younger than 24 hours
  if (Date.now() - Number(timestamp) > (24 * 60 * 60 * 1000))
    return res.redirect(`${ON_RECOVERY_RESULT_URL}?recovery=fail`);
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users?email=${email}`,
      auth: {
        username: API_USER,
        password: API_PASSWORD
      }
    });
    let user = first(result.data);
    if (user && md5(user._id + timestamp) === key) {
      let password = md5(Date.now()).substring(0, 6);
      await axios({
        method: 'PUT',
        url: `${API_URL}/users/${user._id}`,
        data: { password },
        auth: {
          username: API_USER,
          password: API_PASSWORD
        }
      });
      let emailBody = await mail.createMailBody('recoveryResult', {
        username: user.email,
        password,
        link: `${ON_RECOVERY_RESULT_URL}?recovery=success`
      });
      await mail.sendMail('Password Recovery Success', '', user.email, emailBody);
      res.redirect(`${ON_RECOVERY_RESULT_URL}?recovery=success`);
    } else {
      res.redirect(`${ON_RECOVERY_RESULT_URL}?recovery=fail`);
    }
  } catch (error) {
    res.redirect(`${ON_RECOVERY_RESULT_URL}?recovery=fail`);
  }
}