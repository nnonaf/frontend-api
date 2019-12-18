const fs = require('fs');
const resizeImg = require('resize-img');
const axios = require('axios');
const { get } = require('lodash');
const { cloudUpload, getCloudUploadOptions } = require('../logic/gcloud');
const isImage = require('is-image');

const API_URL = process.env.API_URL;

var resourceDirectory = process.env.RESOURCE_DIR;
var googleBucketName = process.env.GOOGLE_BUCKET;

module.exports = {
  upload
}

async function upload(req, res) {
  let id = req.swagger.params.id.value;
  if (!req.files)
    return res.status(400).json({
      message: 'No files were uploaded.'
    });
  try {
    let result = await axios({
      method: 'GET',
      url: `${API_URL}/users/${id}`,
      headers: {
        authorization: get(req, 'headers.authorization', '')
      }
    });
    let user = result.data;
    if (!user) {
      return res.status(401).json({ message: 'user not authenticated' });
    }
    let file = req.files.file;
    console.log('file upload from => ', user._id, user.email, file.mimetype, file.name);
    var cloudBase = `files/${user._id}`;
    var thumbBase = `files/${user._id}/thumbs`;
    let key = Date.now();
    let path = `${resourceDirectory}/${key}_${file.name}`;
    let thumbPath = `${resourceDirectory}/thumb_${key}_${file.name}`;
    if (user.isAdmin) {
      if (req.body.dir) {
        cloudBase = `${req.body.dir}`;
        thumbBase = `${req.body.dir}/thumbs`;
      }
      if (req.body.name) {
        path = `${resourceDirectory}/${req.body.name}`;
        thumbPath = `${resourceDirectory}/thumb_${req.body.name}`;
      }
    }
    file.mv(path, async (err) => {
      if (err)
        return res.status(500).send(err);

      let result = {
        url: `https://storage.googleapis.com/${googleBucketName}/${getCloudUploadOptions(path, cloudBase, {}).destination}`
      };

      if (isImage(path)) {
        let buf = await resizeImg(fs.readFileSync(path), { width: 320 });
        fs.writeFileSync(thumbPath, buf);
        result.thumb = `https://storage.googleapis.com/${googleBucketName}/${getCloudUploadOptions(thumbPath, thumbBase, {}).destination}`;
        await cloudUpload(thumbPath, getCloudUploadOptions(thumbPath, thumbBase, {}));
        fs.unlink(thumbPath, () => { });
      }

      await cloudUpload(path, getCloudUploadOptions(path, cloudBase, {}));
      fs.unlink(path, () => { });

      res.json(result);
    });
  } catch (error) {
    res.status(get(error, 'response.status', 500)).json(get(error, 'response.data', { message: 'server error' }));
  }
}