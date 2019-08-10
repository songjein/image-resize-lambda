'use strict'

// sharp docs: https://github.com/lovell/sharp
// sharp tutorial: https://malcoded.com/posts/nodejs-image-resize-express-sharp
// sharp width request: https://github.com/lovell/sharp/issues/247

const AWS = require('aws-sdk');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const express = require('express');
const request = require('request');
const urlencode = require('urlencode');

const BUCKET = 'resizecache.feeeld';
const REGION = 'ap-northeast-2';


const app = express();


AWS.config.update({
  "region": REGION,
});
const s3 = new AWS.S3();


const setContentType = (filename, res) => {
  let contentType = undefined;
  const ext = filename.toLowerCase().split('.').slice(-1)[0];
  if ('gif' == ext) {
    contentType = 'gif'; 
  } else if ('jpg' == ext || 'jpeg' == ext) {
    contentType = 'jpeg';
  } else if ('png' == ext) {
    contentType = 'png';
  } 
  if (contentType === undefined) {
    res.send('not supported image type');
    return;
  }
  res.set('Content-Type', `image/${contentType}`);
}


app.get('/', async (req, res) => {
  const params = req.query; 
  if (!params.url|| !params.size) {
    res.status(500).send('invalid req format');
    return;
  }

  const imageSize = params.size.toLowerCase().split("x");
  let width = parseInt(imageSize[0]); 
  let height = parseInt(imageSize[1]); 
  width = width == 0 ? undefined : width;
  height = height == 0 ? undefined : height;
  
  const imgUrl = params.url;
  const urlSegList = imgUrl.split('/');
  const path = urlSegList.slice(0, urlSegList.length-1).join('/');
  const filename = urlSegList.slice(-1)[0];
  setContentType(filename, res);

  const encodedUrl = path + '/' + urlencode(filename); // inner communication or not? 
  const originalKey = crypto.createHash('md5').update(encodedUrl).digest('hex') + '/' + imageSize;
  
  const getParams = {
    Bucket: BUCKET,
    Key: originalKey, 
  }
  // cache hit?
  try {
    await s3.headObject(getParams).promise(); // existence check
    s3.getObject(getParams).createReadStream().pipe(res);
    console.info(`cache hit! (${ originalKey } - ${ encodedUrl })`);
    console.info('successfully served');
    return;
  } catch (err) {
    console.info(`cache miss! (${ originalKey } - ${ encodedUrl })`, err);
  }
  
  // cache miss!
  request({url: encodedUrl, encoding: null}, async (error, response, buffer) => {
    const { statusCode, statusMessage } = response;
    if (statusCode == 403 || statusCode == 404) {
      res.send(statusMessage) 
      return;
    }
    const stream = sharp(buffer).resize(width, height);
    const uploadBuffer = await stream.toBuffer();
    const uploadParams = { Bucket: BUCKET, Key: originalKey, Body: uploadBuffer };
    try {
      await s3.putObject(uploadParams).promise();
      console.info(`Successfully uploaded data to ${ BUCKET }/${ originalKey }`);
    } catch (e) {
      console.error('S3 upload error', e);
    }
    stream.pipe(res);
    console.info('successfully served');
  });
});


module.exports = app;
