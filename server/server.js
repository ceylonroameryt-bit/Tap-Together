import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 10000;
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: 'tap-together-realtime', rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ ok: false }));
});

const wss = new WebSocketServer({ server });

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(room, sender, payload) {
  for (const client of room.clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, { clients: new Set(), host: null, createdAt: Date.now() });
  return rooms.get(code);
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.clients.size === 0) rooms.delete(code);
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.meta = null;

  const initTimeout = setTimeout(() => {
    if (!ws.meta) ws.close(1008, 'JOIN required');
  }, 10000);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (!ws.meta) {
      if (msg?.type !== 'JOIN') {
        safeSend(ws, { type: 'ERROR', code: 'join_required' });
        return;
      }

      const roomCode = String(msg.room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const name = String(msg.name || 'Player').trim().slice(0, 18) || 'Player';
      const role = msg.role === 'host' ? 'host' : 'guest';

      if (roomCode.length !== 6) {
        safeSend(ws, { type: 'ERROR', code: 'bad_room' });
        ws.close();
        return;
      }

      let room = rooms.get(roomCode);

      if (role === 'host') {
        if (room?.host && room.host.readyState === WebSocket.OPEN) {
          safeSend(ws, { type: 'ERROR', code: 'room_exists' });
          ws.close();
          return;
        }
        room = getRoom(roomCode);
        room.host = ws;
      } else {
        if (!room?.host || room.host.readyState !== WebSocket.OPEN) {
          safeSend(ws, { type: 'ERROR', code: 'room_not_found' });
          ws.close();
          return;
        }
        if (room.clients.size >= 2) {
          safeSend(ws, { type: 'ERROR', code: 'room_full' });
          ws.close();
          return;
        }
      }

      clearTimeout(initTimeout);
      ws.meta = { roomCode, name, role };
      room.clients.add(ws);

      safeSend(ws, { type: 'JOINED', room: roomCode, role });
      broadcast(room, ws, { type: 'HELLO', name, role });

      if (room.clients.size === 2) {
        for (const client of room.clients) safeSend(client, { type: 'CONNECTED' });
      }
      return;
    }

    const room = rooms.get(ws.meta.roomCode);
    if (!room) return;

    if (msg?.type === 'PING') {
      safeSend(ws, { type: 'PONG', t: Date.now() });
      return;
    }

    broadcast(room, ws, msg);
  });

  ws.on('close', () => {
    clearTimeout(initTimeout);
    if (!ws.meta) return;
    const room = rooms.get(ws.meta.roomCode);
    if (!room) return;
    room.clients.delete(ws);
    if (room.host === ws) room.host = null;
    broadcast(room, ws, { type: 'PEER_LEFT', role: ws.meta.role, name: ws.meta.name });
    cleanupRoom(ws.meta.roomCode);
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tap Together realtime server listening on ${PORT}`);
});
