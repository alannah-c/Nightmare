export default {
  port: process.env.PORT || 3001,
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  game: {
    minPlayers: 2,
    maxPlayers: 6,
    gameDurationMinutes: 60,
  },
};
