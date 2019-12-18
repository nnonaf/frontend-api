var { Mail } = require('../models');
var fs = require('fs');
var path = require("path");
var { template, templateSettings } = require('lodash');

const LOGO_URL = process.env.LOGO_URL;
const APP_NAME = process.env.APP_NAME;
const ADDRESS = process.env.ADDRESS;
const FACEBOOK_URL = process.env.FACEBOOK_URL;
const TWITTER_URL = process.env.TWITTER_URL;
const INSTAGRAM_URL = process.env.INSTAGRAM_URL;

var sendMail = (subject, sender, destination, body) => new Promise((resolve, reject) => {
  var mail = new Mail({ subject, sender, destination, body });
  mail.save((err) => {
    if (err) reject(err);
    else resolve(mail);
  });
});

var createMailBody = (type, data) => new Promise((resolve, reject) => {
  fs.readFile(path.resolve(`${__dirname}/mail_templates/${type}.html`), 'utf-8', (err, html) => {
    let compile = template(html);
    resolve(compile(Object.assign({
      _name: APP_NAME,
      _logo: LOGO_URL,
      _address: ADDRESS,
      _facebook_url: FACEBOOK_URL,
      _twitter_url: TWITTER_URL,
      _instagram_url: INSTAGRAM_URL
    }, data)));
  });
});

module.exports = {
  sendMail,
  createMailBody
}