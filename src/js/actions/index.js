const actions = exports = module.exports;
import {
  Howl
}
from 'howler';
import musicOpts from '../../sound/pong_music';

import _ from 'underscore';
export const SHOW_OVERLAY = 'SHOW_OVERLAY';
export const HIDE_OVERLAY = 'HIDE_OVERLAY';
export const SHOW_MESSAGE = 'SHOW_MESSAGE';
export const HIDE_MESSAGE = 'HIDE_MESSAGE';
export const REMOVE_SHAKE = 'REMOVE_SHAKE';
export const LIST_PLAYERS = 'LIST_PLAYERS';
export const CLEAR_PLAYER_LIST = 'CLEAR_PLAYER_LIST';
export const SET_PLAYER_LIST_LOADING = 'SET_PLAYER_LIST_LOADING';
export const SHOW_PLAYER_DETAIL = 'SHOW_PLAYER_DETAIL';
export const START_SELECTION = 'START_SELECTION';
export const END_SELECTION = 'END_SELECTION';
export const HIGHLIGHT_SELECTION = 'HIGHLIGHT_SELECTION';
export const JOIN_GROUP = 'JOIN_GROUP';
export const RESET_GROUPS = 'RESET_GROUPS';
export const READY_UP = 'READY_UP';
export const START_GAME = 'START_GAME';
export const END_GAME = 'END_GAME';
export const MODIFY_POINT = 'MODIFY_POINT';
export const CHANGE_GAME_POINT = 'CHANGE_GAME_POINT';
export const CHANGE_SERVE_INTERVAL = 'CHANGE_SERVE_INTERVAL';
export const FETCH_SETTINGS = 'FETCH_SETTINGS';
export const SWITCH_SERVE = 'SWITCH_SERVE';
export const UPDATE_LAST_POINT = 'UPDATE_LAST_POINT';
export const UPDATE_HISTORY = 'UPDATE_HISTORY';
export const SHOW_GAME_HISTORY = 'SHOW_GAME_HISTORY';
export const SHOW_IMAGE_SELECT_MODAL = 'SHOW_IMAGE_SELECT_MODAL';
export const CLOSE_IMAGE_SELECT_MODAL = 'CLOSE_IMAGE_SELECT_MODAL';
export const SHOW_WEBCAM_UNAVAILABLE = 'SHOW_WEBCAM_UNAVAILABLE';
export const SHOW_WEBCAM_AVAILABLE = 'SHOW_WEBCAM_AVAILABLE';
export const UPLOAD_PLAYER_PIC = 'UPLOAD_PLAYER_PIC';
export const UPLOAD_PLAYER_PIC_COUNTDOWN = 'UPLOAD_PLAYER_PIC_COUNTDOWN';

const howl = new Howl(musicOpts);

const contentType = {
  'accept': 'application/json',
  'content-type': 'application/json'
};

let msgTimeout;
let msgShakeTimeout;
let gamePtSaveTimeout;
let serveIntervalTimeout;

export function startGame() {
  howl.stop();
  howl.play('applause');
  return {
    type: actions.START_GAME
  };
}

export function fetchSettings() {
  return dispatch => {
    return fetch('/fetch/settings/')
      .then(response => response.json())
      .then(function(json) {
        if (json.errno) {
          dispatch(showMessage('danger', 'Something went wrong.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
        } else {
          dispatch(loadSettings(json));
        }
      });
  };
}


export function changeGamePoint(point) {
  return dispatch => {
    clearTimeout(gamePtSaveTimeout);
    dispatch(gamePointChange(point));
    gamePtSaveTimeout = setTimeout(function() {
      dispatch(saveSetting('game_point', point));
    }, 400);
  };
}

export function changeServeInterval(point) {
  return dispatch => {
    clearTimeout(serveIntervalTimeout);
    dispatch(serveIntervalChange(point));
    serveIntervalTimeout = setTimeout(function() {
      dispatch(saveSetting('serve_interval', point));
    }, 400);
    return {
      type: actions.CHANGE_GAME_POINT,
      point
    };
  };
}

export function endSelection() {
  return {
    type: actions.END_SELECTION
  };
}

export function modifyPoint(group, event) {
  if (event === 'SCORE_UP') {
    howl.play('make_score');
  }
  return (dispatch, getState) => {
    dispatch(pointModify(group, event));
    const {
      game
    } = getState();
    if (!game.active) {
      dispatch(gameEnd());
      dispatch(saveStats(game));
      const bannerTheme = game.winner === 'groupOne' ? 'group-one-win' : 'group-two-win';
      dispatch(showMessage(bannerTheme, 'HOLD BUTTON FOR REMATCH / DOUBLE TAP TO QUIT'));
    } else {
      const { groupOne, groupTwo, serveInterval, lastSwitchPoint } = game;
      const totalScore = groupOne.score + groupTwo.score;
      if (event === 'SCORE_UP') {
        if ((totalScore % serveInterval === 0) && (totalScore === lastSwitchPoint + serveInterval)) {
          dispatch(switchServe());
          howl.play('switch_serve');
          const lastPoint = totalScore;
          const whoIsServing = groupOne.serving ? 'groupOne' : 'groupTwo';
          dispatch(updateLastPoint(lastPoint));
          dispatch(updateHistory('SERVING', whoIsServing));
        }
      } else {
        if (totalScore === lastSwitchPoint - 1) {
          dispatch(switchServe());
          const lastPoint = lastSwitchPoint - serveInterval;
          const whoIsServing = groupOne.serving ? 'groupOne' : 'groupTwo';
          howl.play('switch_serve');
          dispatch(updateLastPoint(lastPoint));
          dispatch(updateHistory('SERVING', whoIsServing));
        }
      }
      dispatch(updateHistory(event, group));
    }
  };
}

export function endGame() {
  howl.play('no_contest', function() {
    setTimeout(function() {
      howl.play('crowd_upset');
    }, 1000);
  });
  return dispatch => {
    clearTimeout(msgTimeout);
    dispatch(showMessage('warning', 'THE GAME HAS ENDED'));
    dispatch(gameEnd());
    dispatch(groupReset());
    msgTimeout = setTimeout(function() {
      dispatch(hideMessage());
    }, 3000);
  };
}

export function toggleReady(side, gameStart) {
  return (dispatch, getState) => {
    const {
      game
    } = getState();
    if (!game[side].ready) {
      howl.play('ready');
    }
    dispatch(readyToggle(side));
    if (gameStart) {
      clearTimeout(msgTimeout);
      dispatch(hideMessage());
      dispatch(fetchSettings());
      dispatch(hideOverlay());
      dispatch(startGame());
    }
  };
}

export function startSelection(group, player) {
  const msgType = group === 'groupOne' ? 'group-one' : 'group-two';
  return dispatch => {
    clearTimeout(msgTimeout);
    dispatch(hideMessage());
    dispatch(showMessage(msgType, 'SELECT A PLAYER'));
    dispatch(selectionStart(group, player));
  };
}

export function showSelectionWarning() {
  return dispatch => {
    clearTimeout(msgTimeout);
    dispatch(showMessage('warning', 'PLAYER ALREADY CHOSEN. PLEASE CHOOSE ANOTHER'));
  };
}

export function resetGroups() {
  return dispatch => {
    clearTimeout(msgTimeout);
    dispatch(hideMessage());
    dispatch(groupReset());
  };
}

export function showImageSelectModal(picType) {
  return {
    type: actions.SHOW_IMAGE_SELECT_MODAL,
    picType
  };
}

export function closeImageSelectModal() {
  return {
    type: actions.CLOSE_IMAGE_SELECT_MODAL
  }
}

export function showWebCamUnavailable() {
  return {
    type: actions.SHOW_WEBCAM_UNAVAIBLE
  }
}

export function showWebCamAvailable() {
  return {
    type: actions.SHOW_WEBCAM_AVAILABLE
  }
}

export function hideMessage() {
  return {
    type: actions.HIDE_MESSAGE
  };
}

export function takePicture(playerId, picType, picture) {
  return dispatch => {
    dispatch(uploadPlayerPic(playerId, picType, picture));
  }
}
export function playerPicCountDown () {
  return dispatch => {
    var count = 3;
    dispatch(updatePlayerPicCountDown(count));
    const countDownInterval = setInterval(() => {
      count = count - 1;
      if (count > 0) {
        dispatch(updatePlayerPicCountDown(count));
      } else {
        clearInterval(countDownInterval);
        dispatch(updatePlayerPicCountDown(count));
        dispatch(closeImageSelectModal());
      }
    }, 1000);
  }
}

function updatePlayerPicCountDown (count) {
  return {
    type: actions.UPLOAD_PLAYER_PIC_COUNTDOWN,
    count
  }
}

function uploadPlayerPic(playerId, picType, picture) {
  return dispatch => {
      return fetch('/upload/player/picture', {
        method: 'POST',
        headers: contentType,
        body: JSON.stringify({
          playerId,
          picType,
          picture
        })
      })
        .then(response => response.json())
        .then(function(json) {
          if (json.errno || json.error) {
            dispatch(showMessage('danger', 'An error has occurred'));
          }
          const currentFilter = document.getElementById('player-profile-filter-input').value;
          console.log(currentFilter);
          dispatch(postPlayerPic);
          dispatch(fetchPlayers(currentFilter || '', 'updated_on DESC'));
          dispatch(fetchPlayerDetails(playerId));
        });
    }
}

function postPlayerPic () {
  return {
    type: actions.UPLOAD_PLAYER_PIC
  }
}

export function highlightSelection(id) {
  howl.play('player_cursor');
  return {
    type: actions.HIGHLIGHT_SELECTION,
    id
  };
}

export function joinGroup(group, player, id, name, standardPose, winningPose) {
  howl.play('chosen');
  const msgType = group === 'groupOne' ? 'group-one' : 'group-two';
  return dispatch => {
    clearTimeout(msgTimeout);
    dispatch(playerJoinGroup(group, player, id, name, standardPose, winningPose));
    dispatch(showMessage(msgType, 'Picked ' + name + '!'));
    dispatch(endSelection());
    msgTimeout = setTimeout(function() {
      dispatch(hideMessage());
    }, 3000);
  };
}

export function showOverlay(overlayIndex) {
  if (overlayIndex === 4) {
    howl.play('smash_theme', function() {
      setTimeout(function() {
        howl.play('choose_character');
      }, 500);
    });
  }
  return dispatch => {
    dispatch(hideMessage());
    dispatch(overlayShow(overlayIndex));
  };
}


export function hideOverlay() {
  return (dispatch, getState) => {
    const {
      overlay
    } = getState();
    if (overlay.activeIndex === 4) {
      howl.stop();
    }
    dispatch(overlayHide());
  };
}

function overlayHide() {
  return {
    type: actions.HIDE_OVERLAY
  };
}

export function fetchPlayerDetails(playerId) {
  return dispatch => {
    return fetch('/fetch/player/' + playerId)
      .then(response => response.json())
      .then(function(json) {
        if (json.errno) {
          dispatch(showMessage('danger', 'Something went wrong communicating with the database.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
        } else {
          dispatch(loadPlayerInfo(json));
        }
      });
  };
}

export function fetchHistory() {
  return dispatch => {
    return fetch('/fetch/history/')
      .then(response => response.json())
      .then(function(json) {
        if (json.errno) {
          dispatch(showMessage('danger', 'Something went wrong communicating with the database.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
        } else {
          dispatch(loadHistory(json));
        }
      });
  };
}

export function changePlayerPic(playerId, picType, file) {
  const ext = file.name.match(/\.(jpg|png|jpeg)$/i);
  return dispatch => {
    clearTimeout(msgTimeout);
    clearTimeout(msgShakeTimeout);
    if (ext === null) {
      dispatch(showMessage('danger', 'Must be .jpg or .png file'));
    } else {
      const data = new FormData;
      data.append('file', file);
      data.append('picType', picType);
      data.append('id', playerId);
      return fetch('/update/player/picture', {
        method: 'POST',
        body: data
      })
        .then(response => response.json())
        .then(function(json) {
          if (json.errno || json.error) {
            dispatch(showMessage('danger', 'An error has occurred'));
          }
          dispatch(fetchPlayerDetails(playerId));
          // TODO: Do not get value by raw javascript. Maybe use state?
          const currentFilter = document.getElementById('player-profile-filter-input').value;
          dispatch(fetchPlayers(currentFilter, 'updated_on DESC'));
        });
    }
    msgTimeout = setTimeout(function() {
      dispatch(hideMessage());
    }, 3000);
  };
}

export function createNewPlayer(playerName) {
  return dispatch => {
    clearTimeout(msgTimeout);
    clearTimeout(msgShakeTimeout);
    if (playerName.trim().length) {
      if (playerName.trim().length > 21) {
        dispatch(showMessage('danger', 'Player Name is too long.'));
        msgTimeout = setTimeout(function() {
          dispatch(hideMessage());
        }, 3000);
      } else {
        return fetch('/create/player', {
          method: 'POST',
          headers: contentType,
          body: JSON.stringify({
            'name': playerName.trim()
          })
        })
          .then(response => response.json())
          .then(function(json) {
            if (json.errno === 19) {
              dispatch(showMessage('danger', playerName + '  is already a player'));
              msgShakeTimeout = setTimeout(function() {
                dispatch(removeMsgShake());
              }, 1000);
            } else {
              dispatch(showMessage('success', 'Player created: ' + playerName));
              dispatch(fetchPlayers('', 'updated_on DESC'));
            }
            msgTimeout = setTimeout(function() {
              dispatch(hideMessage());
            }, 3000);
          });
      }
    } else {
      msgTimeout = setTimeout(function() {
        dispatch(hideMessage());
      }, 3000);

      msgShakeTimeout = setTimeout(function() {
        dispatch(removeMsgShake());
      }, 1000);
      dispatch(showMessage('danger', 'Player name is empty. Try again.'));
    }
  };
}

export function fetchPlayers(filter, sort) {
  clearTimeout(msgTimeout);
  clearTimeout(msgShakeTimeout);
  return dispatch => {
    dispatch(clearPlayerList());
    dispatch(setPlayerListLoading())
    return fetch('/fetch/players', {
      method: 'POST',
      headers: contentType,
      body: JSON.stringify({
        'filter': filter.trim(),
        sort
      })
    })
      .then(response => response.json())
      .then(function(json) {
        if (json.errno) {
          console.log(json);
          dispatch(showMessage('danger', 'Error communicating to the database.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
          msgShakeTimeout = setTimeout(function() {
            dispatch(removeMsgShake());
          }, 1000);
        } else {
          dispatch(showPlayerList(json));
        }
      });
  };
}


function saveSetting(column, value) {
  return dispatch => {
    return fetch('/save/setting', {
      method: 'POST',
      headers: contentType,
      body: JSON.stringify({
        column,
        value
      })
    })
      .then(response => response.json())
      .then(function(json) {
        if (json.errno) {
          dispatch(showMessage('danger', 'Error communicating to the database.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
          msgShakeTimeout = setTimeout(function() {
            dispatch(removeMsgShake());
          }, 1000);
        }
      });
  };
}

function saveStats(game) {
  const {
    groupOne, groupTwo, winner, gameHistory
  } = game;
  const loser = winner === 'groupOne' ? 'groupTwo' : 'groupOne';
  const winnerClip = winner === 'groupOne' ? 'blue_team' : 'red_team';

  howl.play('game_end', function() {
    setTimeout(function() {
      howl.play('winner_screen', function() {
        setTimeout(function() {
          howl.play('winner', function() {
            setTimeout(function() {
              howl.play(winnerClip, function() {
                howl.play('cheer');
              }, 500);
            }, 1600);
          });
        }, 1000);
      });
    }, 1000);
  });

  let gameType = 'singles';
  const winnerIds = [];
  const loserIds = [];
  const groupOneIds = [];
  const groupTwoIds = [];

  if (groupOne.playerOne.active && groupOne.playerTwo.active ||
    groupTwo.playerOne.active && groupTwo.playerTwo.active) {
    gameType = 'doubles';
  }
  // Get Winner Ids
  _.each(game[winner], function(player, key) {
    if (key === 'playerOne' || key === 'playerTwo') {
      if (player.active) {
        winnerIds.push(player.id);
        if (winner === 'groupOne') {
          groupOneIds.push(player.id);
        } else {
          groupTwoIds.push(player.id);
        }
      }
    }
  });
  // Get Loser Ids
  _.each(game[loser], function(player, key) {
    if (key === 'playerOne' || key === 'playerTwo') {
      if (player.active) {
        loserIds.push(player.id);
        if (loser === 'groupOne') {
          groupOneIds.push(player.id);
        } else {
          groupTwoIds.push(player.id);
        }
      }
    }
  });
  // Save history
  const groupOneObj = {
    id: groupOneIds,
    score: game.groupOne.score,
    rawScore: game.groupOne.rawScore
  };

  const groupTwoObj = {
    id: groupTwoIds,
    score: game.groupTwo.score,
    rawScore: game.groupTwo.rawScore
  };
  return dispatch => {
    dispatch(saveHistory(groupOneObj, groupTwoObj, gameHistory, gameType, winner));
    return fetch('/save/winloss', {
      method: 'POST',
      headers: contentType,
      body: JSON.stringify({
        'winningIds': winnerIds.join(','),
        'losingIds': loserIds.join(','),
        gameType
      })
    })
      .then(response => response.json())
      .then(function(json) {
        if (json.errno === 19) {
          dispatch(showMessage('danger', 'Error communicating to the database.'));
          msgTimeout = setTimeout(function() {
            dispatch(hideMessage());
          }, 3000);
          msgShakeTimeout = setTimeout(function() {
            dispatch(removeMsgShake());
          }, 1000);
        }
      });
  };
}

function saveHistory(groupOne, groupTwo, log, type, winner) {
  return dispatch => {
    return fetch('/save/history', {
      method: 'POST',
      headers: contentType,
      body: JSON.stringify({
        groupOne,
        groupTwo,
        log,
        type,
        winner
      })
    })
    .then(response => response.json())
    .then(function(json) {
      if (json.errno) {
        dispatch(showMessage('danger', 'Error communicating to the database.'));
        msgTimeout = setTimeout(function() {
          dispatch(hideMessage());
        }, 3000);
      }
    });
  };
}

function loadPlayerInfo(playerInfo) {
  return {
    type: actions.SHOW_PLAYER_DETAIL,
    playerInfo
  };
}

function loadHistory(history) {
  return {
    type: actions.SHOW_GAME_HISTORY,
    history
  };
}

function overlayShow(overlayIndex) {
  return {
    type: actions.SHOW_OVERLAY,
    overlayIndex
  };
}

function removeMsgShake() {
  return {
    type: actions.REMOVE_SHAKE
  };
}

function clearPlayerList() {
  return {
    type: actions.CLEAR_PLAYER_LIST
  };
}

function setPlayerListLoading() {
  return {
    type: actions.SET_PLAYER_LIST_LOADING
  }
}

function showPlayerList(playerList) {
  return {
    type: actions.LIST_PLAYERS,
    playersLoaded: true,
    playersLoading: false,
    playerList
  };
}

function showMessage(type, message) {
  return {
    type: actions.SHOW_MESSAGE,
    message,
    messageType: type
  };
}

function selectionStart(group, player) {
  return {
    type: actions.START_SELECTION,
    group,
    player
  };
}

function groupReset() {
  return {
    type: actions.RESET_GROUPS
  };
}

function readyToggle(side) {
  return {
    type: actions.READY_UP,
    side
  };
}

function loadSettings(settings) {
  return {
    type: actions.FETCH_SETTINGS,
    settings
  };
}

function gameEnd() {
  return {
    type: actions.END_GAME
  };
}


function pointModify(group, event) {
  return {
    type: actions.MODIFY_POINT,
    event,
    group
  };
}

function gamePointChange(point) {
  return {
    type: actions.CHANGE_GAME_POINT,
    point
  };
}

function serveIntervalChange(point) {
  return {
    type: actions.CHANGE_SERVE_INTERVAL,
    point
  };
}

function playerJoinGroup(group, player, id, name, standardPose, winningPose) {
  return {
    type: actions.JOIN_GROUP,
    group,
    player,
    id,
    name,
    standardPose,
    winningPose
  };
}

function switchServe() {
  return {
    type: actions.SWITCH_SERVE
  };
}

function updateLastPoint(point) {
  return {
    type: actions.UPDATE_LAST_POINT,
    point
  };
}

function updateHistory(event, side) {
  const group = side || null;
  return {
    type: actions.UPDATE_HISTORY,
    event,
    group
  };
}
