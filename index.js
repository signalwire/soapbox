const express = require('express');
require('dotenv').config()

const PORT = process.env.PORT || 5000
const app = express();
const http = require('http').createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
var expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
const path = require('path');
app.use(express.static('public'))
var cors = require('cors')
app.use(cors());
const { uuid } = require('uuidv4');

var cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['some-long-signing-cookie', 'some-long-other-key'],
  maxAge: 24 * 60 * 60 * 1000 * 10 // 10 days
}))

const utility = require('./lib/utility')

// SSE for alerts
var SSE = require('express-sse');
var sse = new SSE(['SignalWire SSE started']);
app.get('/stream', (req, res, next) => {
  res.flush = () => {}; 
  next();
}, sse.init);

async function sendEvent(payload) {
  await sse.send(payload);
}

// SignalWire real time events
const createClient = require('@signalwire/realtime-api').createClient;
createClient({
  project: process.env.SIGNALWIRE_PROJECT_KEY,
  token: process.env.SIGNALWIRE_TOKEN
}).then(async (client) => {
  client.video.on('room.started', async (roomSession) => {
    sendEvent(await utility.getActiveRooms());
  
    roomSession.on('member.joined', async (member) => {
      sendEvent(await utility.getActiveRooms());
    })

    roomSession.on('member.left', async (member) => {
      sendEvent(await utility.getActiveRooms());
    })
  
    await roomSession.subscribe()
  });

  client.video.on('room.ended', async (roomSession) => {
    sendEvent(await utility.getActiveRooms());
  });

  client.connect()
});

function isLoggedIn(req, res, next) {
  if (req.session.name && req.session.id) {
    res.locals.current_user = {
      name: req.session.name,
      id: req.session.id
    }
    // this keeps the session alive forever as long as you stay on
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3);
    next();
  } else {
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  }
}

app.get("/", isLoggedIn, (req, res) => {
  res.render('index');
});

app.post("/create", isLoggedIn, async (req, res) => {
  var name = uuid();
  var display_name = req.body.roomName;
  await utility.apiRequest('/api/video/rooms', {name, display_name});
  res.redirect('/room/' + name);
});

app.post("/promote", isLoggedIn, async (req, res) => {
  console.log('memberID', req.body)
  var memberId = req.body.memberId;
  sendEvent({event: 'promote', memberId });
  res.send('ok')
});

app.get('/room/:roomName', isLoggedIn, async (req, res) => {
  var roomName = req.params.roomName;
  var roomInformation = await utility.apiRequest('/api/video/rooms/' + roomName, {}, 'get');
  console.log(roomInformation.data)
  var roomId = roomInformation.data.id;
  var userName = res.locals.current_user.name
  var token = await utility.getVideoToken(roomName, userName, 'moderator')
  var roomUrl = '/room/' + roomName;
  var participantUrl = '/participant/' + roomId;
  res.render('room', { room: roomName, displayName: roomInformation.data.display_name, token, user: userName, roomUrl, participantUrl })
})

app.get('/participant/:roomId', isLoggedIn, async (req, res) => {
  var roomId = req.params.roomId;
  var roomInformation = await utility.apiRequest('/api/video/rooms/' + roomId, {}, 'get');
  var roomName = roomInformation.data.name;
  var userName = res.locals.current_user.name
  var token = await utility.getVideoToken(roomName, userName, 'participant')
  var participantUrl = '/participant/' + roomId;
  res.render('participant', { room: roomName, displayName: roomInformation.data.display_name, token, user: userName, participantUrl })
})

app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  req.session.name = req.body.yourName;
  req.session.id = uuid();
  res.redirect(req.session.returnTo || '/');
  delete req.session.returnTo;
});

app.get("/logout", (req, res) => {
  req.session = null
  res.redirect('/');
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening to ${PORT}`);
});