const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'PORT'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
}

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const replayRoutes = require('./routes/replayRoutes');
const compilerRoutes = require('./routes/compilerRoutes');

const initInterviewSocket = require('./socket/interviewSocket');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/replay', replayRoutes);
app.use('/api/compiler', compilerRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: Cookies missing'));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.session_token;

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid session credentials'));
  }
});

initInterviewSocket(io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Engine Core Online on Port ${PORT}`);
});