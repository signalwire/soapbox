const axios = require('axios');

async function apiRequest(path, data = {}, method = 'post') {
  var url = `https://${process.env.SIGNALWIRE_SPACE}${path}`
  console.log(url)
  var payload = {
    method,
    url,
    auth: {
      username: process.env.SIGNALWIRE_PROJECT_KEY,
      password: process.env.SIGNALWIRE_TOKEN
    },
    validateStatus: () => true
  }

  if (method != 'get') {
    payload.data = data;
  }
  const res = await axios(payload);
  
  return res;
}

const moderatorPermissions = [
  "room.list_available_layouts",
  "room.set_layout",
  "room.member.audio_mute",
  "room.member.audio_unmute",
  "room.member.deaf",
  "room.member.undeaf",
  "room.member.remove",
  "room.member.set_input_sensitivity",
  "room.member.set_input_volume",
  "room.member.set_output_volume",
  "room.member.video_mute",
  "room.member.video_unmute",
  "room.hide_video_muted",
];

const normalPermissions = [
  "room.self.audio_mute",
  "room.self.audio_unmute",
  "room.self.video_mute",
  "room.self.video_unmute",
  "room.self.deaf",
  "room.self.undeaf",
  "room.self.set_input_volume",
  "room.self.set_output_volume",
  "room.self.set_input_sensitivity",
  "room.hide_video_muted",
  "room.show_video_muted",
];

async function getVideoToken(room_name, user_name, mode = 'participant') {
  if (mode == 'moderator') {
    var permissions = moderatorPermissions;
  } else {
    var permissions = normalPermissions;
  }
  var token_request = await apiRequest('/api/video/room_tokens', {room_name, user_name, permissions});

  return token_request.data.token
}

async function getActiveRooms() {
  var output = [];
  var sessions = await apiRequest('/api/video/room_sessions', {}, 'get');

  for (let s of sessions.data.data) {
    if (s.status == 'in-progress') {
      var memberList = [];
      var members = await apiRequest(`/api/video/room_sessions/${s.id}/members`, {}, 'get');
      members.data.data.forEach((m) => {
        if (m.leave_time == null) {
          memberList.push(m.name);
        }
      });
      output.push({
        id: s.name,
        display_name: s.display_name,
        members: memberList
      });
    }
  }

  return output;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function getActiveRooms() {
  var output = [];
  var sessions = await apiRequest('/api/video/room_sessions', {}, 'get');

  for (let s of sessions.data.data) {
    if (s.status == 'in-progress') {
      var memberList = [];
      var members = await apiRequest(`/api/video/room_sessions/${s.id}/members`, {}, 'get');
      members.data.data.forEach((m) => {
        if (m.leave_time == null) {
          memberList.push(m.name);
        }
      });
      output.push({
        id: s.name,
        display_name: s.display_name,
        members: memberList
      });
    }
  }

  return output;
}

module.exports = {
  apiRequest,
  getVideoToken,
  getRandomInt,
  getActiveRooms
}