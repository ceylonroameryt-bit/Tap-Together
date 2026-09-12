const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  homeView: $('#homeView'),
  roomView: $('#roomView'),
  gameView: $('#gameView'),
  playerName: $('#playerName'),
  roomCodeInput: $('#roomCodeInput'),
  createRoomBtn: $('#createRoomBtn'),
  joinRoomBtn: $('#joinRoomBtn'),
  leaveRoomBtn: $('#leaveRoomBtn'),
  copyRoomBtn: $('#copyRoomBtn'),
  backToRoomBtn: $('#backToRoomBtn'),
  connectionStatus: $('#connectionStatus'),
  statusText: $('#statusText'),
  roomCodeDisplay: $('#roomCodeDisplay'),
  myName: $('#myName'),
  myAvatar: $('#myAvatar'),
  opponentName: $('#opponentName'),
  opponentAvatar: $('#opponentAvatar'),
  opponentReadyText: $('#opponentReadyText'),
  hostHint: $('#hostHint'),
  gameTitle: $('#gameTitle'),
  gameStage: $('#gameStage'),
  sessionScoreMe: $('#sessionScoreMe'),
  sessionScoreThem: $('#sessionScoreThem'),
  toast: $('#toast')
};

const GAME_TITLES = {
  tap: 'Tap Rush',
  reaction: 'Reaction Duel',
  rps: 'RPS Arena'
};

const state = {
  peer: null,
  conn: null,
  isHost: false,
  roomCode: '',
  name: '',
  opponentName: '',
  currentGame: null,
  scoreMe: 0,
  scoreThem: 0,
  tap: {},
  reaction: {},
  rps: {}
};

let toastTimer;
let tapTimer;
let tapCountdown;
let reactionTimer;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function setStatus(mode, text) {
  els.connectionStatus.dataset.state = mode;
  els.statusText.textContent = text;
}

function showView(view) {
  [els.homeView, els.roomView, els.gameView].forEach((el) => el.classList.remove('active'));
  view.classList.add('active');
}

function sanitizeName(value) {
  const cleaned = (value || '').trim().replace(/[<>]/g, '').slice(0, 18);
  return cleaned || 'Player';
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function peerId(code) {
  return `tap-together-v1-${code}`;
}

function saveName() {
  state.name = sanitizeName(els.playerName.value);
  els.playerName.value = state.name;
  localStorage.setItem('tapTogetherName', state.name);
}

function updateRoomUI() {
  els.roomCodeDisplay.textContent = state.roomCode || '------';
  els.myName.textContent = state.name || 'Player';
  els.myAvatar.textContent = (state.name || 'P').charAt(0).toUpperCase();

  if (state.opponentName) {
    els.opponentName.textContent = state.opponentName;
    els.opponentAvatar.textContent = state.opponentName.charAt(0).toUpperCase();
    els.opponentAvatar.classList.remove('muted');
    els.opponentReadyText.textContent = 'Connected';
    els.hostHint.textContent = 'Connected — pick any game';
  } else {
    els.opponentName.textContent = 'Waiting…';
    els.opponentAvatar.textContent = '?';
    els.opponentAvatar.classList.add('muted');
    els.opponentReadyText.textContent = state.isHost ? 'Share the code' : 'Connecting…';
    els.hostHint.textContent = state.isHost ? 'Waiting for another player' : 'Joining room…';
  }

  $$('.game-card').forEach((button) => {
    button.disabled = !(state.conn && state.conn.open);
  });
}

function clearGameTimers() {
  clearInterval(tapTimer);
  clearTimeout(tapCountdown);
  clearTimeout(reactionTimer);
  tapTimer = null;
  tapCountdown = null;
  reactionTimer = null;
}

function send(data) {
  if (state.conn && state.conn.open) {
    state.conn.send(data);
    return true;
  }
  showToast('The other player is not connected.');
  return false;
}

function setupConnection(conn) {
  if (state.conn && state.conn.open) {
    conn.close();
    return;
  }

  state.conn = conn;

  conn.on('open', () => {
    setStatus('online', 'Connected');
    send({ type: 'HELLO', name: state.name });
    updateRoomUI();
  });

  conn.on('data', handleMessage);

  conn.on('close', () => {
    state.opponentName = '';
    state.conn = null;
    setStatus('connecting', state.isHost ? 'Waiting' : 'Disconnected');
    updateRoomUI();
    if (state.currentGame) {
      state.currentGame = null;
      clearGameTimers();
      showView(els.roomView);
    }
    showToast('The other player disconnected.');
  });

  conn.on('error', () => {
    showToast('Connection problem. Try the room code again.');
  });
}

function attachPeerEvents(peer) {
  peer.on('connection', (conn) => {
    if (!state.isHost) return conn.close();
    setupConnection(conn);
  });

  peer.on('error', (error) => {
    console.error(error);
    if (error.type === 'peer-unavailable') {
      showToast('Room not found. Check the code.');
    } else if (error.type === 'unavailable-id') {
      showToast('That room code is already active. Create another room.');
    } else {
      showToast('Could not connect. Check your internet and try again.');
    }
    if (!state.isHost) setStatus('offline', 'Offline');
  });
}

function createRoom() {
  if (typeof Peer === 'undefined') {
    showToast('Online service did not load. Refresh the page.');
    return;
  }

  saveName();
  disconnect(false);
  state.isHost = true;
  state.roomCode = generateCode();
  state.peer = new Peer(peerId(state.roomCode));
  setStatus('connecting', 'Opening room');
  attachPeerEvents(state.peer);

  state.peer.on('open', () => {
    setStatus('connecting', 'Waiting');
    updateRoomUI();
    showView(els.roomView);
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomCode);
    history.replaceState({}, '', url);
  });
}

function joinRoom() {
  if (typeof Peer === 'undefined') {
    showToast('Online service did not load. Refresh the page.');
    return;
  }

  const code = els.roomCodeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code.length !== 6) {
    showToast('Enter the 6-character room code.');
    return;
  }

  saveName();
  disconnect(false);
  state.isHost = false;
  state.roomCode = code;
  state.peer = new Peer();
  setStatus('connecting', 'Connecting');
  attachPeerEvents(state.peer);
  updateRoomUI();
  showView(els.roomView);

  state.peer.on('open', () => {
    const conn = state.peer.connect(peerId(code), { reliable: true });
    setupConnection(conn);
  });
}

function disconnect(goHome = true) {
  clearGameTimers();
  try { if (state.conn) state.conn.close(); } catch (_) {}
  try { if (state.peer) state.peer.destroy(); } catch (_) {}
  state.peer = null;
  state.conn = null;
  state.opponentName = '';
  state.currentGame = null;
  state.roomCode = '';
  state.scoreMe = 0;
  state.scoreThem = 0;
  setStatus('offline', 'Offline');
  if (goHome) {
    history.replaceState({}, '', window.location.pathname);
    showView(els.homeView);
  }
}

function handleMessage(message) {
  if (!message || typeof message !== 'object') return;

  switch (message.type) {
    case 'HELLO':
      state.opponentName = sanitizeName(message.name);
      updateRoomUI();
      break;
    case 'GAME_START':
      openGame(message.game, false);
      break;
    case 'EXIT_GAME':
      if (state.currentGame) {
        state.currentGame = null;
        clearGameTimers();
        showView(els.roomView);
        showToast('Your opponent returned to the game shelf.');
      }
      break;
    case 'TAP_START':
      if (state.currentGame === 'tap') prepareTapRound(message.delay || 900);
      break;
    case 'TAP_SCORE':
      if (state.currentGame === 'tap') receiveTapScore(message.score);
      break;
    case 'TAP_DONE':
      if (state.currentGame === 'tap') receiveTapDone(message.score);
      break;
    case 'REACTION_START':
      if (state.currentGame === 'reaction') prepareReactionRound(message.delay);
      break;
    case 'REACTION_RESULT':
      if (state.currentGame === 'reaction') receiveReactionResult(message.value);
      break;
    case 'RPS_CHOICE':
      if (state.currentGame === 'rps') receiveRpsChoice(message.choice);
      break;
    case 'RPS_RESET':
      if (state.currentGame === 'rps') resetRpsRound(false);
      break;
    default:
      break;
  }
}

function startGame(game) {
  if (!GAME_TITLES[game] || !(state.conn && state.conn.open)) return;
  openGame(game, true);
  send({ type: 'GAME_START', game });
}

function openGame(game, localStart) {
  if (!GAME_TITLES[game]) return;
  clearGameTimers();
  state.currentGame = game;
  state.scoreMe = 0;
  state.scoreThem = 0;
  updateSessionScore();
  els.gameTitle.textContent = GAME_TITLES[game];
  showView(els.gameView);

  if (game === 'tap') renderTapGame();
  if (game === 'reaction') renderReactionGame();
  if (game === 'rps') renderRpsGame();

  if (!localStart) showToast(`${state.opponentName || 'Opponent'} started ${GAME_TITLES[game]}.`);
}

function updateSessionScore() {
  els.sessionScoreMe.textContent = state.scoreMe;
  els.sessionScoreThem.textContent = state.scoreThem;
}

function awardResult(result) {
  if (result === 'win') state.scoreMe += 1;
  if (result === 'lose') state.scoreThem += 1;
  updateSessionScore();
}

// TAP RUSH ------------------------------------------------------------
function renderTapGame() {
  state.tap = { me: 0, them: 0, running: false, meDone: false, themDone: false, seconds: 10 };
  els.gameStage.innerHTML = `
    <span class="eyebrow">10 second battle</span>
    <h2>Tap Rush</h2>
    <p>When the round begins, tap the button as fast as you can. Highest total wins.</p>
    <div class="duel-board">
      <div class="duel-stat"><small>You</small><strong id="tapMe">0</strong></div>
      <div class="duel-stat"><small>${escapeHtml(state.opponentName || 'Opponent')}</small><strong id="tapThem">0</strong></div>
    </div>
    <button class="tap-button" id="tapButton" disabled>READY</button>
    <div class="progress-wrap">
      <div class="progress-labels"><span id="tapRoundText">Start when ready</span><span id="tapTime">10.0s</span></div>
      <div class="progress-track"><div class="progress-bar" id="tapProgress"></div></div>
    </div>
    <div class="round-actions"><button class="btn primary" id="tapStartBtn">Start round</button></div>
    <div id="tapResult"></div>
  `;

  $('#tapStartBtn').addEventListener('click', () => {
    if (state.tap.running) return;
    send({ type: 'TAP_START', delay: 900 });
    prepareTapRound(900);
  });
  $('#tapButton').addEventListener('pointerdown', tapOnce);
}

function prepareTapRound(delay) {
  clearInterval(tapTimer);
  clearTimeout(tapCountdown);
  state.tap = { me: 0, them: 0, running: false, meDone: false, themDone: false, seconds: 10 };
  const me = $('#tapMe');
  const them = $('#tapThem');
  const button = $('#tapButton');
  const result = $('#tapResult');
  const start = $('#tapStartBtn');
  if (!me || !them || !button) return;
  me.textContent = '0';
  them.textContent = '0';
  result.innerHTML = '';
  start.disabled = true;
  button.disabled = true;
  button.textContent = '3…2…1';
  $('#tapRoundText').textContent = 'Get ready';
  $('#tapProgress').style.width = '0%';
  $('#tapTime').textContent = '10.0s';

  tapCountdown = setTimeout(beginTapRound, Math.max(400, Number(delay) || 900));
}

function beginTapRound() {
  const button = $('#tapButton');
  if (!button || state.currentGame !== 'tap') return;
  state.tap.running = true;
  state.tap.startedAt = performance.now();
  button.disabled = false;
  button.textContent = 'TAP';
  $('#tapRoundText').textContent = 'GO!';

  tapTimer = setInterval(() => {
    const elapsed = performance.now() - state.tap.startedAt;
    const remaining = Math.max(0, 10000 - elapsed);
    const pct = Math.min(100, (elapsed / 10000) * 100);
    $('#tapTime').textContent = `${(remaining / 1000).toFixed(1)}s`;
    $('#tapProgress').style.width = `${pct}%`;
    if (remaining <= 0) finishTapRound();
  }, 50);
}

function tapOnce(event) {
  event.preventDefault();
  if (!state.tap.running) return;
  state.tap.me += 1;
  $('#tapMe').textContent = state.tap.me;
  send({ type: 'TAP_SCORE', score: state.tap.me });
}

function receiveTapScore(score) {
  const value = Math.max(0, Number(score) || 0);
  state.tap.them = value;
  const el = $('#tapThem');
  if (el) el.textContent = value;
}

function finishTapRound() {
  if (!state.tap.running) return;
  state.tap.running = false;
  state.tap.meDone = true;
  clearInterval(tapTimer);
  const button = $('#tapButton');
  if (button) {
    button.disabled = true;
    button.textContent = state.tap.me;
  }
  const time = $('#tapTime');
  if (time) time.textContent = '0.0s';
  const progress = $('#tapProgress');
  if (progress) progress.style.width = '100%';
  send({ type: 'TAP_DONE', score: state.tap.me });
  resolveTapRound();
}

function receiveTapDone(score) {
  state.tap.them = Math.max(0, Number(score) || 0);
  state.tap.themDone = true;
  const them = $('#tapThem');
  if (them) them.textContent = state.tap.them;
  resolveTapRound();
}

function resolveTapRound() {
  if (!state.tap.meDone || !state.tap.themDone) return;
  let type = 'draw';
  let text = `Draw — ${state.tap.me} taps each.`;
  if (state.tap.me > state.tap.them) { type = 'win'; text = `You win ${state.tap.me}–${state.tap.them}.`; }
  if (state.tap.me < state.tap.them) { type = 'lose'; text = `${state.opponentName || 'Opponent'} wins ${state.tap.them}–${state.tap.me}.`; }
  awardResult(type);
  $('#tapResult').innerHTML = `<div class="result-banner ${type}">${text}</div>`;
  $('#tapStartBtn').disabled = false;
  $('#tapStartBtn').textContent = 'Play again';
  $('#tapRoundText').textContent = 'Round complete';
}

// REACTION DUEL -------------------------------------------------------
function renderReactionGame() {
  state.reaction = { phase: 'idle', me: null, them: null, resolved: false };
  els.gameStage.innerHTML = `
    <span class="eyebrow">Reflex battle</span>
    <h2>Reaction Duel</h2>
    <p>Start a round, then wait. Tap only when the pad turns green. An early tap counts as a false start.</p>
    <div class="duel-board">
      <div class="duel-stat"><small>You</small><strong id="reactionMe">—</strong></div>
      <div class="duel-stat"><small>${escapeHtml(state.opponentName || 'Opponent')}</small><strong id="reactionThem">—</strong></div>
    </div>
    <button class="reaction-pad" id="reactionPad">START A ROUND</button>
    <div class="round-actions"><button class="btn primary" id="reactionStartBtn">Start round</button></div>
    <div id="reactionResult"></div>
  `;

  $('#reactionStartBtn').addEventListener('click', startReactionRound);
  $('#reactionPad').addEventListener('pointerdown', reactionTap);
}

function startReactionRound() {
  if (state.reaction.phase === 'waiting' || state.reaction.phase === 'go') return;
  const delay = 1600 + Math.floor(Math.random() * 3000);
  send({ type: 'REACTION_START', delay });
  prepareReactionRound(delay);
}

function prepareReactionRound(delay) {
  clearTimeout(reactionTimer);
  state.reaction = { phase: 'waiting', me: null, them: null, resolved: false, goAt: 0 };
  const pad = $('#reactionPad');
  if (!pad) return;
  pad.className = 'reaction-pad waiting';
  pad.textContent = 'WAIT…';
  $('#reactionMe').textContent = '—';
  $('#reactionThem').textContent = '—';
  $('#reactionResult').innerHTML = '';
  $('#reactionStartBtn').disabled = true;

  reactionTimer = setTimeout(() => {
    if (state.currentGame !== 'reaction' || state.reaction.phase !== 'waiting') return;
    state.reaction.phase = 'go';
    state.reaction.goAt = performance.now();
    pad.className = 'reaction-pad go';
    pad.textContent = 'TAP!';
    playTone(700, 0.07);
  }, Math.max(900, Number(delay) || 2000));
}

function reactionTap(event) {
  event.preventDefault();
  const pad = $('#reactionPad');
  if (!pad) return;

  if (state.reaction.phase === 'waiting') {
    state.reaction.phase = 'done';
    state.reaction.me = -1;
    clearTimeout(reactionTimer);
    pad.className = 'reaction-pad false-start';
    pad.textContent = 'TOO EARLY';
    $('#reactionMe').textContent = 'FALSE';
    send({ type: 'REACTION_RESULT', value: -1 });
    resolveReactionRound();
    return;
  }

  if (state.reaction.phase === 'go') {
    const value = Math.max(1, Math.round(performance.now() - state.reaction.goAt));
    state.reaction.phase = 'done';
    state.reaction.me = value;
    pad.className = 'reaction-pad';
    pad.textContent = `${value} ms`;
    $('#reactionMe').textContent = `${value}ms`;
    send({ type: 'REACTION_RESULT', value });
    resolveReactionRound();
  }
}

function receiveReactionResult(value) {
  state.reaction.them = Number(value);
  const them = $('#reactionThem');
  if (them) them.textContent = value < 0 ? 'FALSE' : `${Math.round(value)}ms`;
  resolveReactionRound();
}

function resolveReactionRound() {
  if (state.reaction.resolved || state.reaction.me === null || state.reaction.them === null) return;
  state.reaction.resolved = true;
  const me = state.reaction.me;
  const them = state.reaction.them;
  let type = 'draw';
  let text = 'Both players false-started. Draw.';

  if (me < 0 && them >= 0) { type = 'lose'; text = 'False start — opponent wins the round.'; }
  else if (me >= 0 && them < 0) { type = 'win'; text = 'Opponent false-started — you win.'; }
  else if (me >= 0 && them >= 0 && me < them) { type = 'win'; text = `You were ${them - me}ms faster.`; }
  else if (me >= 0 && them >= 0 && me > them) { type = 'lose'; text = `${state.opponentName || 'Opponent'} was ${me - them}ms faster.`; }
  else if (me >= 0 && them >= 0 && me === them) { text = `Exact tie at ${me}ms.`; }

  awardResult(type);
  $('#reactionResult').innerHTML = `<div class="result-banner ${type}">${text}</div>`;
  $('#reactionStartBtn').disabled = false;
  $('#reactionStartBtn').textContent = 'Play again';
}

// ROCK PAPER SCISSORS -------------------------------------------------
function renderRpsGame() {
  state.rps = { me: null, them: null, resolved: false };
  els.gameStage.innerHTML = `
    <span class="eyebrow">Classic duel</span>
    <h2>RPS Arena</h2>
    <p>Choose your move. Your opponent's move stays hidden on screen until both players have locked in.</p>
    <div class="rps-options">
      <button class="rps-btn" data-choice="rock">✊<span>Rock</span></button>
      <button class="rps-btn" data-choice="paper">✋<span>Paper</span></button>
      <button class="rps-btn" data-choice="scissors">✌️<span>Scissors</span></button>
    </div>
    <div class="duel-board">
      <div class="duel-stat"><small>Your move</small><strong id="rpsMe">—</strong></div>
      <div class="duel-stat"><small>${escapeHtml(state.opponentName || 'Opponent')}</small><strong id="rpsThem">—</strong></div>
    </div>
    <div id="rpsResult"></div>
    <div class="round-actions"><button class="btn primary" id="rpsResetBtn" disabled>Next round</button></div>
  `;

  $$('.rps-btn').forEach((button) => button.addEventListener('click', () => chooseRps(button.dataset.choice)));
  $('#rpsResetBtn').addEventListener('click', () => {
    send({ type: 'RPS_RESET' });
    resetRpsRound(false);
  });
}

const rpsEmoji = { rock: '✊', paper: '✋', scissors: '✌️' };

function chooseRps(choice) {
  if (state.rps.me || !rpsEmoji[choice]) return;
  state.rps.me = choice;
  $('#rpsMe').textContent = rpsEmoji[choice];
  $$('.rps-btn').forEach((button) => { button.disabled = true; });
  send({ type: 'RPS_CHOICE', choice });
  if (!state.rps.them) $('#rpsResult').innerHTML = '<div class="result-banner draw">Move locked. Waiting for opponent…</div>';
  resolveRpsRound();
}

function receiveRpsChoice(choice) {
  if (!rpsEmoji[choice]) return;
  state.rps.them = choice;
  resolveRpsRound();
}

function resolveRpsRound() {
  if (state.rps.resolved || !state.rps.me || !state.rps.them) return;
  state.rps.resolved = true;
  $('#rpsThem').textContent = rpsEmoji[state.rps.them];

  const me = state.rps.me;
  const them = state.rps.them;
  const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  let type = 'draw';
  let text = 'Draw. Same move.';
  if (wins[me] === them) { type = 'win'; text = 'You win this round.'; }
  else if (wins[them] === me) { type = 'lose'; text = `${state.opponentName || 'Opponent'} wins this round.`; }

  awardResult(type);
  $('#rpsResult').innerHTML = `<div class="result-banner ${type}">${text}</div>`;
  $('#rpsResetBtn').disabled = false;
}

function resetRpsRound(notify) {
  state.rps = { me: null, them: null, resolved: false };
  const me = $('#rpsMe');
  const them = $('#rpsThem');
  const result = $('#rpsResult');
  const reset = $('#rpsResetBtn');
  if (me) me.textContent = '—';
  if (them) them.textContent = '—';
  if (result) result.innerHTML = '';
  if (reset) reset.disabled = true;
  $$('.rps-btn').forEach((button) => { button.disabled = false; });
  if (notify) send({ type: 'RPS_RESET' });
}

function playTone(frequency, duration) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.addEventListener('ended', () => ctx.close());
  } catch (_) {}
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

els.createRoomBtn.addEventListener('click', createRoom);
els.joinRoomBtn.addEventListener('click', joinRoom);
els.roomCodeInput.addEventListener('input', () => {
  els.roomCodeInput.value = els.roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});
els.roomCodeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') joinRoom();
});
els.leaveRoomBtn.addEventListener('click', () => disconnect(true));
els.copyRoomBtn.addEventListener('click', async () => {
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set('room', state.roomCode);
  const text = `${state.roomCode} — ${shareUrl.toString()}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Room code and link copied.');
  } catch (_) {
    showToast(`Room code: ${state.roomCode}`);
  }
});
els.backToRoomBtn.addEventListener('click', () => {
  send({ type: 'EXIT_GAME' });
  state.currentGame = null;
  clearGameTimers();
  showView(els.roomView);
});
$$('.game-card').forEach((button) => button.addEventListener('click', () => startGame(button.dataset.game)));

window.addEventListener('beforeunload', () => disconnect(false));

// Initial state
els.playerName.value = localStorage.getItem('tapTogetherName') || '';
const initialRoom = new URLSearchParams(window.location.search).get('room');
if (initialRoom) els.roomCodeInput.value = initialRoom.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
updateRoomUI();
