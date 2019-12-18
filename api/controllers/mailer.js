'use strict';

const Mail = require('../data/mail');

module.exports = {
  sendMail
}

async function sendMail(req, res) {
  try {
    let { subject, sender, destination, body } = req.body;
    let emailResult = await Mail.sendMail(subject, sender, destination, body);
    res.json(emailResult);
  } catch (error) {
    res.status(500).json({ message: 'server error' });
  }
}