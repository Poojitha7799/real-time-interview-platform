const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 User connected to socket sync engine: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`📁 User ${socket.id} joined room context: ${roomId}`);
  });

  socket.on('code_change', ({ roomId, code }) => {
    socket.to(roomId).emit('code_update', code);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected from sync engine: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Socket real-time synchronization link alive at port ${PORT}`);
});