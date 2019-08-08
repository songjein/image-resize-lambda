'use strict'

// sharp docs: https://github.com/lovell/sharp
// sharp tutorial: https://malcoded.com/posts/nodejs-image-resize-express-sharp
// sharp width request: https://github.com/lovell/sharp/issues/247

const path = require('path');
const sharp = require('sharp');
const express = require('express');
const request = require('request');
const urlencode = require('urlencode');

const app = express();

app.get('/', (req, res) => {
  const widthStr = req.query.width;
  const heightStr = req.query.height;
  let imgUrl = req.query.url;

  let width, height;
  if (widthStr) {
    width = parseInt(widthStr);	
  }
  if (heightStr) {
    height = parseInt(heightStr);	
  }

  const split = imgUrl.split('/');
  const path = split.slice(0, split.length-1).join('/');
  const filename = split.slice(-1)[0];

  imgUrl = path + '/' + urlencode(filename);

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
  
  request({url: imgUrl, encoding: null}, function(error, response, buffer) {
    const { statusCode, statusMessage } = response;
    if (statusCode == 403 || statusCode == 404) {
      res.send(statusMessage) 
      return;
    }
    sharp(buffer)
      .resize(width, height)
      .pipe(res);
  });
});

module.exports = app;
