const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`Authenticated connection established for user: ${socket.user.email}`);

  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
  });
});