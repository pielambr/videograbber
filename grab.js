const request = require('request');
const filesize = require('filesize');
const ffmpeg = require('fluent-ffmpeg');
const shortid = require('shortid');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const regex = /(http[s]?:\/\/.+m3u8)/;

function notify(sessionID, event, message) {
  if (sessionID in global.sessions) {
    const id = global.sessions[sessionID];
    global.io.sockets.connected[id].emit(event, message);
  }
}

function downloadPlaylist(req, res, url, origin) {
  if (!fs.existsSync(`videos/${req.sessionID}`)) {
    fs.mkdirSync(`videos/${req.sessionID}`);
  }
  const name = shortid.generate();
  const dir = `videos/${req.sessionID}/${name}.mp4`;
  const command = ffmpeg(url).audioCodec('copy').videoCodec('copy')
                             .on('error', (err) => {
                               console.log(err); // eslint-disable-line
                               notify(req.sessionID, 'processed');
                             })
                             .on('end', () => {
                               global.files[name] = origin;
                               notify(req.sessionID, 'processed');
                             })
                             .output(dir);
  command.execute();
}

function grabVideo(req, res) {
  if (!req.body || !req.body.site_url) {
    return res.sendStatus(400);
  }
  notify(req.sessionID, 'processing');
  request(req.body.site_url, (err, resp, body) => {
    if (err) {
      notify(req.sessionID, 'processed');
      return res.sendStatus(500);
    }
    const result = body.match(regex);
    return downloadPlaylist(req, res, result[1], req.body.site_url);
  });
  return res.json({ success: true, message: 'Processing URL...' });
}

function getFiles(req, res) {
  if (!fs.existsSync(`videos/${req.sessionID}/`)) {
    return res.json({ files: [] });
  }
  const files = fs.readdirSync(`videos/${req.sessionID}/`);
  const response = [];
  files.forEach((file) => {
    response.push({
      download: `videos/${req.sessionID}/${file}`,
      size: filesize(fs.statSync(`videos/${req.sessionID}/${file}`).size,
      { base: 10 }),
      url: global.files[file.split('.')[0]],
    });
  });
  return res.json({ files: response });
}

function cleanFiles() {
  const hourAgo = new Date().getTime() - 3600000;
  fs.readdir('videos/', (err, folders) => {
    folders.forEach((folder) => {
      const dir = path.join('videos/', folder);
      fs.stat(dir, (err2, stat) => {
        if (stat && stat.isDirectory()) {
          fs.readdir(dir, (err3, files) => {
            if (files.length < 1) {
              fs.rmdir(dir);
            } else {
              files.forEach((file) => {
                fs.stat(path.join('videos/', folder, file), (err4, stat2) => {
                  const lastChanged = new Date(stat2.ctime).getTime();
                  if (lastChanged < hourAgo) {
                    return rimraf(path.join('videos', folder, file));
                  }
                  return false;
                });
              });
            }
          });
        }
      });
    });
  });
}

module.exports = { grabVideo, getFiles, cleanFiles };
