const jwt = require('jsonwebtoken');
const securityService = require('../services/securityService');
const db = require('../config/db');

const activeRooms = {};
const roomStartTimes = {};

module.exports = (io) => {
  
  // Guardrail: Enforce secure authorization validation prior to handling socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication failed. Security token parameter missing.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; 
      next();
    } catch (err) {
      return next(new Error('Authentication failed. Signature credentials invalid or expired.'));
    }
  });

  io.on('connection', (socket) => {

    socket.on('join-room', async ({ roomId, sessionType }) => {
      try {
        // Improvement 2: Zero-Trust Access Control — Verify Room Membership before allowing entrance
        const [sessionRows] = await db.execute(
          'SELECT candidate_email, interviewer_email FROM interview_sessions WHERE id = ?',
          [roomId]
        );

        if (sessionRows.length > 0) {
          const session = sessionRows[0];
          const userEmail = socket.user.email;
          const userRole = socket.user.role;

          // Admins bypass restriction checks. Live candidates/interviewers must match database assignment tags.
          if (userRole !== 'admin' && userEmail !== session.candidate_email && userEmail !== session.interviewer_email) {
            return socket.emit('error-alert', { message: 'Access Denied: You are not assigned to this private session.' });
          }
        }

        // Proceed to join room safely after validation checks out
        socket.join(roomId);
        
        await db.execute(
          'INSERT IGNORE INTO interview_sessions (id, session_type, created_at) VALUES (?, ?, NOW())',
          [roomId, sessionType || 'mock']
        );
      } catch (err) { 
        console.error("[SERVER ENGINE] Failed initialization footprint:", err); 
        return socket.emit('error-alert', { message: 'Database validation synchronization fault.' });
      }

      if (!roomStartTimes[roomId]) {
        roomStartTimes[roomId] = Date.now();
      }
      
      socket.emit('room-started', { startTime: roomStartTimes[roomId] });
      
      if (activeRooms[roomId]) {
        socket.emit('code-update', activeRooms[roomId].code);
      } else {
        activeRooms[roomId] = {
          code: '// Shared Source Engine Workspace active...',
          lastSavedCode: '',
          lastSaveTime: 0
        };
      }
      
      socket.to(roomId).emit('user-connected', { username: socket.user.username });

      // Improvement 1: In-Memory Cleanup Pipeline on Client Disconnect
      socket.on('disconnect', () => {
        const room = io.sockets.adapter.rooms.get(roomId);
        
        // If room is undefined or size is zero, the last remaining developer has left the room
        if (!room || room.size === 0) {
          delete activeRooms[roomId];
          delete roomStartTimes[roomId];
          console.log(`[STATE CLEANUP] Flushed structural tracking nodes for inactive session: ${roomId}`);
        }
      });
    });

    socket.on('code-change', async ({ roomId, code }) => {
      if (!activeRooms[roomId]) {
        activeRooms[roomId] = { code: '', lastSavedCode: '', lastSaveTime: 0 };
      }
      
      activeRooms[roomId].code = code;
      socket.to(roomId).emit('code-update', code);
      
      const now = Date.now();
      const startTime = roomStartTimes[roomId] || now;
      
      if (now - activeRooms[roomId].lastSaveTime > 3000 && code !== activeRooms[roomId].lastSavedCode) {
        activeRooms[roomId].lastSavedCode = code;
        activeRooms[roomId].lastSaveTime = now;
        
        const elapsedTime = Math.floor((now - startTime) / 1000);
        
        db.execute(
          'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, "code_change", ?)',
          [roomId, elapsedTime, code]
        ).catch(err => console.error("[SERVER ENGINE] Async trace save drop:", err));
      }
    });

    socket.on('deploy-paper', async ({ roomId, compiledPaper }) => {
      if (socket.user.role !== 'interviewer' && socket.user.role !== 'admin') {
        return socket.emit('error-alert', { message: 'Unauthorized action vector.' });
      }

      socket.to(roomId).emit('paper-deployed', compiledPaper);
      
      try {
        const startTime = roomStartTimes[roomId] || Date.now();
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        await db.execute(
          'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, "problem_change", ?)',
          [roomId, elapsedTime, JSON.stringify(compiledPaper)]
        );
      } catch (err) { 
        console.error("[SERVER ENGINE] Failed logging paper deployment:", err); 
      }
    });

    socket.on('shift-paper-index', ({ roomId, index, starterCode }) => {
      if (socket.user.role !== 'interviewer' && socket.user.role !== 'admin') return;
      socket.to(roomId).emit('paper-index-shifted', { index, starterCode });
    });

    socket.on('language-change', ({ roomId, language }) => {
      socket.to(roomId).emit('language-update', language);
    });

    socket.on('audit-log', (logData) => {
      socket.to(logData.roomId).emit('audit-alert', logData);
    });

    socket.on('security-violation', async ({ roomId, violationType, message }) => {
      socket.to(roomId).emit('receive-chat', { sender: 'System/Proctor', message });
      
      try {
        const startTime = roomStartTimes[roomId] || Date.now();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        await securityService.handleViolation({ roomId, violationType, message, elapsedSeconds });
      } catch (err) { 
        console.error("[SERVER ENGINE] Socket pipeline failed handling violation metrics:", err); 
      }
    });

    socket.on('send-chat', async ({ roomId, message }) => {
      socket.to(roomId).emit('receive-chat', { message, sender: socket.user.username });
      
      try {
        const startTime = roomStartTimes[roomId] || Date.now();
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        await db.execute(
          'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, "chat_msg", ?)',
          [roomId, elapsedTime, JSON.stringify({ message, sender: socket.user.username })]
        );
      } catch (err) { 
        console.error("[SERVER ENGINE] Failed logging conversation packet:", err); 
      }
    });

    socket.on('console-change', ({ roomId, consoleOutput }) => {
      socket.to(roomId).emit('console-update', consoleOutput);
    });

    socket.on('custom-input-change', ({ roomId, customInput }) => {
      socket.to(roomId).emit('custom-input-update', customInput);
    });

    socket.on('video-offer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('video-offer', sdp);
    });

    socket.on('video-answer', ({ roomId, sdp }) => {
      socket.to(roomId).emit('video-answer', sdp);
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

  });
};