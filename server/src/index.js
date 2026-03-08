import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from '../config/default.js';
import { registerLobbyEvents } from './events/lobbyEvents.js';
import { registerGameEvents } from './events/gameEvents.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  registerLobbyEvents(io, socket);
  registerGameEvents(io, socket); // includes disconnect handling
});

httpServer.listen(config.port, () => {
  console.log(`Nightmare server running on port ${config.port}`);
});
