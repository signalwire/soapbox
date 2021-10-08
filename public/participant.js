let _currentRoom = null
const memberList = new Map()
let myMemberId = null;

let audioActive = false;
let videoActive = false;

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
      muteSelf();
      muteVideoSelf();
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
    var item = clone.querySelector('li');
    item.id = member.id
    if (its_me) {
      item.querySelector('.participantName').innerText = member.name + '(me)';
    } else {
      item.querySelector('.participantName').innerText = member.name
    }
    parent.appendChild(clone);
  }
}

window.ready(function () {
  connect();
})