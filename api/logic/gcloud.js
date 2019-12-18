var path = require('path');
var storage = require('@google-cloud/storage');
var { map, pick } = require('lodash');

const googleBucketName = process.env.GOOGLE_BUCKET;
const googleProjectId = process.env.GOOGLE_PROJECT_ID;

var gcs = storage({
  projectId: googleProjectId
});

var bucket = gcs.bucket(googleBucketName);

const getCloudUploadOptions = (file, cloudBase, meta) => {
  return {
    destination: `${cloudBase}/${path.basename(file)}`,
    public: true,
    metadata: {
      metadata: meta
    }
  };
}

const upload = (file, options) => {
  return new Promise((resolve, reject) => {
    bucket.upload(file, options, (err, result) => {
      err && reject(err);
      !err && resolve(options);
    });
  });
}

const remove = (file) => {
  return new Promise((resolve, reject) => {
    let gFile = bucket.file(file);
    gFile.delete((err, result) => {
      err && reject(err);
      !err && resolve(result);
    });
  });
}

/**
 * gets file list in a bucket path
 * @param {String} path 
 * @returns {Promise<Array<Object>>}
 */
const files = (path) => new Promise((resolve, reject) => {
  bucket.getFiles({
    autoPaginate: false,
    prefix: path
  }, (err, files) => {
    if (err) reject(err);
    else resolve(map(files, (x) => ({ name: `https://storage.googleapis.com/${googleBucketName}/${x.name}` })));
  });
});

module.exports = {
  getCloudUploadOptions,
  cloudUpload: upload,
  remove,
  files
}
