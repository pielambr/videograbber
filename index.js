const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
global.io = require('socket.io')(http);
const session = require('express-session');
const grabber = require('./grab');
const serveStatic = require('serve-static');
const path = require('path');
const schedule = require('node-schedule');

require('dotenv').config();

const encodedParser = bodyParser.urlencoded({
  extended: false,
});
const secretSession = session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
});
const rule = new schedule.RecurrenceRule();
rule.minute = 15;

schedule.scheduleJob(rule, grabber.cleanFiles);

app.set('view engine', 'pug');

app.use(secretSession);
global.io.use((socket, next) => {
  secretSession(socket.request, socket.request.res, next);
});

app.use('/videos/', serveStatic(path.join(__dirname, 'videos')));

global.sessions = {};
global.files = {};

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Video Grabber',
  });
});

app.post('/files/', encodedParser, grabber.grabVideo);

app.get('/files/', grabber.getFiles);

global.io.on('connection', (s) => {
  global.sessions[s.request.sessionID] = s.id;
  s.on('disconnect', () => {
    delete global.sessions[s.request.sessionID];
  });
});

http.listen(process.env.PORT);

module.exports = http;
