import express from 'express';

const router = express.Router();

export interface RoomState {
  currentTrack: any | null;
  isPlaying: boolean;
  currentTime: number;
  queue: any[];
  timestamp: number;
}

export interface RoomMember {
  id: string;
  name: string;
  lastSeen: number;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  createdAt: number;
  lastActivity: number;
  state: RoomState;
  members: Map<string, RoomMember>;
}

// In-memory store for rooms
const rooms = new Map<string, Room>();
const MAX_ROOMS = 500;
const ROOM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Periodic cleanup of stale rooms
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > ROOM_EXPIRY_MS) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
router.post('/create', (req, res) => {
  if (rooms.size >= MAX_ROOMS) {
    return res.status(503).json({ error: 'Server room capacity reached. Please try later.' });
  }

  const { hostName, hostId = Math.random().toString(36).substring(2, 9) } = req.body || {};
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const newRoom: Room = {
    code,
    hostId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    state: {
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      queue: [],
      timestamp: Date.now()
    },
    members: new Map<string, RoomMember>()
  };

  newRoom.members.set(hostId, {
    id: hostId,
    name: (typeof hostName === 'string' && hostName.trim().slice(0, 30)) || 'Host',
    lastSeen: Date.now(),
    isHost: true
  });

  rooms.set(code, newRoom);

  return res.json({
    roomCode: code,
    hostId,
    members: Array.from(newRoom.members.values()),
    state: newRoom.state
  });
});

// Join an existing room
router.post('/join', (req, res) => {
  const { roomCode, memberName, memberId = Math.random().toString(36).substring(2, 9) } = req.body || {};
  if (!roomCode || typeof roomCode !== 'string') {
    return res.status(400).json({ error: 'Valid roomCode is required' });
  }

  const normalizedCode = roomCode.trim().toUpperCase().slice(0, 8);
  const room = rooms.get(normalizedCode);

  if (!room) {
    return res.status(404).json({ error: 'Room not found or expired' });
  }

  room.lastActivity = Date.now();
  const safeName = (typeof memberName === 'string' && memberName.trim().slice(0, 30)) || 'Listener';

  room.members.set(memberId, {
    id: memberId,
    name: safeName,
    lastSeen: Date.now(),
    isHost: memberId === room.hostId
  });

  return res.json({
    roomCode: room.code,
    hostId: room.hostId,
    members: Array.from(room.members.values()),
    state: room.state
  });
});

// Get room details and current playback state
router.get('/:code', (req, res) => {
  const code = req.params.code?.trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Filter out members who haven't sent a heartbeat in 45 seconds
  const now = Date.now();
  for (const [id, member] of room.members.entries()) {
    if (now - member.lastSeen > 45000 && !member.isHost) {
      room.members.delete(id);
    }
  }

  return res.json({
    roomCode: room.code,
    hostId: room.hostId,
    members: Array.from(room.members.values()),
    state: room.state,
    lastActivity: room.lastActivity
  });
});

// Host syncs playback state to the room
router.post('/:code/sync', (req, res) => {
  const code = req.params.code?.trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { hostId, currentTrack, isPlaying, currentTime, queue } = req.body || {};
  if (room.hostId !== hostId) {
    return res.status(403).json({ error: 'Only the room host can synchronize playback' });
  }

  room.lastActivity = Date.now();
  room.state = {
    currentTrack: currentTrack || null,
    isPlaying: Boolean(isPlaying),
    currentTime: typeof currentTime === 'number' && !isNaN(currentTime) ? currentTime : 0,
    queue: Array.isArray(queue) ? queue.slice(0, 100) : [],
    timestamp: Date.now()
  };

  return res.json({ success: true, state: room.state });
});

// Member heartbeat
router.post('/:code/heartbeat', (req, res) => {
  const code = req.params.code?.trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { memberId } = req.body || {};
  if (memberId && room.members.has(memberId)) {
    const member = room.members.get(memberId)!;
    member.lastSeen = Date.now();
    room.lastActivity = Date.now();
  }

  return res.json({
    roomCode: room.code,
    memberCount: room.members.size,
    state: room.state
  });
});

export default router;
