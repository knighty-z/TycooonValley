import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { registerSocketHandlers } from './sockets/index.js';
import { persistenceService } from './services/PersistenceService.js';
import { roomManager } from './services/RoomManager.js';

const app = express();
const server = http.createServer(app);

// CORS origin validator (supports Vercel preview & production deployments)
const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // allow same-origin, curl, server-to-server
  if (config.clientUrl === '*') return true;
  if (origin === config.clientUrl) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  return false;
};

// Express CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Basic rate limiting on HTTP endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Health check endpoint for Render / AWS / monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeRooms: roomManager['rooms']?.size ?? 0
  });
});

// Room status query
app.get('/api/rooms/:roomCode', (req, res) => {
  const room = roomManager.getRoom(req.params.roomCode);
  if (!room) {
    return res.status(404).json({ exists: false, error: 'Room not found' });
  }
  return res.json({
    exists: true,
    roomCode: room.roomCode,
    phase: room.phase,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers
  });
});

// Player stats query
app.get('/api/stats/:sessionId', async (req, res) => {
  try {
    const stats = await persistenceService.getPlayerStats(req.params.sessionId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Socket.IO with WebSocket + polling transports
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, origin || true);
      } else {
        callback(new Error('Blocked by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 25000
});

registerSocketHandlers(io);

// Graceful startup
async function startServer() {
  await persistenceService.connect();
  await roomManager.hydrateActiveRooms();

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  TYCOONVALE MULTIPLAYER GAME SERVER ACTIVE    `);
    console.log(`  Port: ${config.port} | Host: 0.0.0.0 | Mode: ${config.nodeEnv} `);
    console.log(`  Health: http://0.0.0.0:${config.port}/api/health `);
    console.log(`===============================================`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

startServer();
