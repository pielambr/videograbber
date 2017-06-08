const request = require('request');
const ffmpeg = require('fluent-ffmpeg');
const shortid = require('shortid');
const fs = require('fs');

const regex = /(http[s]?:\/\/.+m3u8)/;

function notify(sessionID, event, message) {
  if (sessionID in global.sessions) {
    const id = global.sessions[sessionID];
    global.io.sockets.connected[id].emit(event, message);
  }
}

function downloadPlaylist(req, res, url) {
  if (!fs.existsSync(`videos/${req.sessionID}`)) {
    fs.mkdirSync(`videos/${req.sessionID}`);
  }
  const name = shortid.generate();
  const path = `videos/${req.sessionID}/${name}.mp4`;
  const command = ffmpeg(url).audioCodec('copy').videoCodec('copy')
                             .on('error', (err) => {
                               console.log(err); // eslint-disable-line
                               notify(req.sessionID, 'processed');
                             })
                             .on('end', () => (
                               notify(req.sessionID, 'processed')
                             ))
                             .output(path);
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
    return downloadPlaylist(req, res, result[1]);
  });
  return res.json({ success: true, message: 'Processing URL...' });
}

function getFileList(req, res) {
  if (!fs.existsSync(`videos/${req.sessionID}/`)) {
    return res.json({ files: [] });
  }
  const files = fs.readdirSync(`videos/${req.sessionID}/`);
  const response = [];
  files.forEach((file) => {
    response.push({ file, size: fs.statSync(`videos/${req.sessionID}/${file}`).size });
  });
  return res.json({ files: response });
}

module.exports = { grabVideo, getFileList };
