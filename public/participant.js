let _currentRoom = null
const memberList = new Map()
let myMemberId = null;

let audioActive = true;
let videoActive = true;

/**
 * Connect with Relay creating a client and attaching all the event handler.
 */
window.connect = () => {
  SignalWire.Video.createRoomObject({
    token: TOKEN,
    rootElementId: 'videoRoot',
    audio: false,
    video: false,
  }).then((roomObject) => {
    _currentRoom = roomObject

    _currentRoom.on('room.started', (params) =>
      console.log('>> DEMO room.started', params)
    )

    _currentRoom.on('room.joined', async (params) => {
      console.log('>> DEMO room.joined', params)
      myMemberId = params.member_id;
      params.room.members.forEach((member) => {
        memberList.set(member.id, member);
      });
      renderMemberList();
      // muteSelf();
      // muteVideoSelf();
    })

    _currentRoom.on('room.updated', (params) =>
      console.log('>> DEMO room.updated', params)
    )
    _currentRoom.on('room.ended', (params) => {
      console.log('>> DEMO room.ended', params)
      hangup()
    })
    _currentRoom.on('member.joined', (params) => {
      console.log('>> DEMO member.joined', params);
      memberList.set(params.member.id, params.member);
      renderMemberList();
    })
    _currentRoom.on('member.updated', (params) =>
      console.log('>> DEMO global member.updated', params)
    )

    _currentRoom.on('member.updated.audio_muted', (params) => {
      console.log('>> DEMO member.updated.audio_muted', params);
    })
    _currentRoom.on('member.updated.video_muted', (params) =>
      console.log('>> DEMO member.updated.video_muted', params)
    )

    _currentRoom.on('member.left', (params) => {
      console.log('>> DEMO member.left', params);
      memberList.delete(params.member.id);
      renderMemberList();
    })
    _currentRoom.on('layout.changed', (params) => {
      console.log('>> DEMO layout.changed', params);
    })

    _currentRoom.on('track', (event) => console.log('>> DEMO track', event))
    _currentRoom.on('destroy', () => {
    })

    _currentRoom
      .join()
      .then((result) => {
        console.log('>> Room Joined', result)
      })
      .catch((error) => {
        console.error('Join error?', error)
      })
  })
}

/**
 * Hangup the _currentRoom if present
 */
window.hangup = () => {
  if (_currentRoom) {
    _currentRoom.hangup()
  }
}

window.muteSelf = () => {
  _currentRoom.audioMute(_currentRoom.member_id)
}

window.unmuteSelf = () => {
  _currentRoom.audioUnmute(_currentRoom.member_id)
}

window.muteVideoSelf = () => {
  _currentRoom.videoMute(_currentRoom.member_id)
}

window.unmuteVideoSelf = () => {
  _currentRoom.videoUnmute(_currentRoom.member_id)
}

function setOutput() {
  var audioOutput = document.getElementById('audiooutput').value;
  _currentRoom.updateSpeaker({ deviceId: audioOutput });
}

async function hangupCall() {
  await _currentRoom.leave();
  window.location.href = "/";
}

window.renderMemberList = () => {
  console.log('MEMBER LIST', memberList);
  var parent = document.querySelector('#participantList');

  // remove all members properly
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  var template = document.querySelector('#participantTpl');
  renderMember(parent, template, memberList.get(myMemberId), true);
  memberList.forEach((member) => {
    if (member.id != myMemberId) {
      renderMember(parent, template, member)
    }
  }); 
}

window.renderMember = (parent, template, member, its_me) => {
  if (member) {
    var clone = template.content.cloneNode(true);
    var item = clone.querySelector('.participant');
    item.id = member.id
    item.querySelector('.participantAvatar').src = `https://avatars.dicebear.com/api/gridy/${member.id}.svg`
    if (its_me) {
      item.querySelector('.participantName').innerText = member.name + '(me)';
    } else {
      item.querySelector('.participantName').innerText = member.name
    }
    
    parent.appendChild(clone);
  }
}

function toggleMuteFn() {
  if (audioActive) {
    document.getElementById('toggleMute').innerText = 'Unmute';
    muteSelf();
    audioActive = false;
  } else {
    document.getElementById('toggleMute').innerText = 'Mute';
    unmuteSelf();
    audioActive = true;
  }
}

function toggleVideoMuteFn() {
  if (videoActive) {
    document.getElementById('toggleVideoMute').innerText = 'Start Video';
    muteVideoSelf();
    videoActive = false;
  } else {
    document.getElementById('toggleVideoMute').innerText = 'Stop Video';
    unmuteVideoSelf();
    videoActive = true;
  }
}

async function handlePromote() {
  listDevices();
  _currentRoom.updateCamera(true);
  _currentRoom.updateMicrophone(true);
  unmuteSelf();
  unmuteVideoSelf();
  $('.hiddenControl').show();
}

function confirmDialog() {
  bootbox.confirm("Join the room as a speaker?", function(result){ 
    console.log('This was logged in the callback: ' + result); 
    if (result == true) {
      handlePromote();
    }
  });
}

async function listDevices() {
  var devices = await SignalWire.WebRTC.getDevicesWithPermissions();
  devices.forEach((device) => {
    var opt = document.createElement('option');
    opt.value = device.deviceId;
    opt.innerHTML = device.label;
    document.getElementById(device.kind).appendChild(opt);
  });
}

function setInput() {
  var audioInput = document.getElementById('audioinput').value;
  _currentRoom.updateMicrophone({ deviceId: audioInput });
  var videoInput = document.getElementById('videoinput').value;
  _currentRoom.updateCamera({ deviceId: videoInput });
}

function setOutput() {
  var audioOutput = document.getElementById('audiooutput').value;
  _currentRoom.updateSpeaker({ deviceId: audioOutput });
}

window.ready(function () {
  var es = new EventSource('/stream');
  es.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log(data);
    if (data.event == 'promote' && data.memberId == myMemberId) {
      confirmDialog();
    }
  };
  connect();
})