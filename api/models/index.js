var mongoose = require('mongoose');

var host = process.env.DB_HOST;
var port = process.env.DB_PORT;
var user = process.env.DB_USER;
var pass = process.env.DB_PASSWORD;
var dbname = process.env.DB_NAME;
var uri = process.env.DB_URI;

mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;
if (uri) {
  mongoose
    .connect(uri)
    .then(() => {
      console.log('connection established');
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  mongoose
    .connect(`mongodb://${host}:${port}/${dbname}`, {
      user,
      pass
    })
    .then(() => {
      console.log('connection established');
    })
    .catch((err) => {
      console.log(err);
    });
}

var User = mongoose.model('User', require('./user')(Schema));
var Project = mongoose.model('Project', require('./project')(Schema));
var Mail = mongoose.model('Mail', require('./mail')(Schema));

var List = mongoose.model('List', require('./list')(Schema));
var Card = mongoose.model('Card', require('./card')(Schema));
var Item = mongoose.model('Item', require('./item')(Schema));
var ProjectState = mongoose.model('ProjectState', require('./projectState')(Schema));
var ActivityLog = mongoose.model('Item', require('./activityLog')(Schema));



module.exports = {  
  User,  
  Mail,
  Project,
  List,
  Card,
  Item,
  ProjectState,
  ActivityLog
};