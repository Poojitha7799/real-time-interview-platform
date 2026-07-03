const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/admin/live-sessions', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const [rows] = await db.execute(`
      SELECT id, candidate_email, interviewer_email, scheduled_date, scheduled_time 
      FROM interview_sessions 
      WHERE session_type = 'live' 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("[SERVER ENGINE] Failed to fetch live registry log history:", err);
    res.status(500).json([]);
  }
});

app.get('/api/admin/problems', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const [rows] = await db.execute('SELECT * FROM coding_problems');
    res.json(rows);
  } catch (err) {
    console.error("[SERVER ENGINE] Failed to fetch problem bank records:", err);
    res.status(500).json([]);
  }
});

app.post('/api/admin/schedule-interview', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { candidateEmail, interviewerEmail, scheduledDate, scheduledTime } = req.body;

  if (!candidateEmail || !scheduledDate || !scheduledTime) {
    return res.status(400).json({ error: "Missing required scheduling parameters." });
  }

  const secureRoomId = 'live-' + Math.random().toString(36).substring(2, 10).toLowerCase();

  try {
    await db.execute(
      `INSERT INTO interview_sessions 
      (id, session_type, candidate_email, interviewer_email, scheduled_date, scheduled_time, candidate_name, academic_dept, verified_skills, created_at) 
      VALUES (?, 'live', ?, ?, ?, ?, 'Poojabathini Node', 'Computer Science and Engineering', 'React, Node.js, Next.js, MySQL, Python', NOW())`,
      [secureRoomId, candidateEmail, interviewerEmail, scheduledDate, scheduledTime]
    );

    res.status(201).json({ success: true, roomId: secureRoomId });

  } catch (err) {
    console.error("[SERVER ENGINE EVENT FAILURE]:", err);
    res.status(500).json({ success: false, error: `System Fault: ${err.message}` });
  }
});

app.get('/api/student/analytics', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const [rows] = await db.execute(`
      SELECT s.id, s.tab_switch_count, s.paste_count, a.overall_score, a.completed_at 
      FROM interview_sessions s
      LEFT JOIN interview_analytics a ON s.id = a.session_id
      WHERE s.session_type = 'mock'
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("[BACKEND SERVER] Analytics DB Fetch Failed:", err);
    res.status(500).json([]);
  }
});

app.get('/api/replay/:sessionId', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const targetId = req.params.sessionId;
  try {
    const [rows] = await db.execute(
      'SELECT elapsed_time_seconds, event_type, event_data FROM replay_events WHERE session_id = ? ORDER BY elapsed_time_seconds ASC',
      [targetId]
    );
    res.json(rows);
  } catch (err) {
    console.error("[BACKEND SERVER] Replay DB Fetch Failed:", err);
    res.status(500).json([]);
  }
});

app.post('/api/ai/evaluate', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { roomId, language } = req.body;
  try {
    const mockAiScorecard = `\n=========================================\n      TECHNICAL ASSESSMENT REPORT        \n=========================================\n1. CODE EFFICIENCY: O(N) Complexity Profile achieved.\n2. ARCHITECTURE: Clean scoping logic layout structures.\n=========================================\n`;
    const overallScore = 85; 
    let connection = await db.getConnection();
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.execute(
        `INSERT INTO interview_analytics 
        (session_id, overall_score, code_efficiency, communication_rating, constructive_feedback) 
        VALUES (?, ?, 'O(N) efficient structural trace.', 'Proactive synchronization feedback loops.', 'Refine null logic boundaries.')`,
        [roomId, overallScore]
      );
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } finally {
      if (connection) connection.release();
    }
    res.json({ evaluation: mockAiScorecard });
  } catch (err) {
    console.error("[BACKEND SERVER] Evaluation Script Faulted:", err);
    res.status(500).json({ error: "Failed to compile metric reports." });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

const activeRooms = {};
const roomStartTimes = {};

io.on('connection', (socket) => {
  
  socket.on('join-room', async ({ roomId, username, sessionType }) => {
    socket.join(roomId);
    try {
      await db.execute(
        'INSERT IGNORE INTO interview_sessions (id, session_type, created_at) VALUES (?, ?, NOW())',
        [roomId, sessionType || 'mock']
      );
    } catch (err) { console.error(err); }

    if (!roomStartTimes[roomId]) roomStartTimes[roomId] = Date.now();
    socket.emit('room-started', { startTime: roomStartTimes[roomId] });
    if (activeRooms[roomId]) socket.emit('code-update', activeRooms[roomId]);
    
    socket.to(roomId).emit('user-connected', { username });
  });

  socket.on('code-change', async ({ roomId, code }) => {
    activeRooms[roomId] = code;
    socket.to(roomId).emit('code-update', code);
    let connection;
    try {
      const startTime = roomStartTimes[roomId] || Date.now();
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      connection = await db.getConnection();
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.execute(
        'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, ?, ?)',
        [roomId, elapsedTime, 'code_change', code]
      );
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) { console.error(err); } finally { if (connection) connection.release(); }
  });

  socket.on('deploy-paper', async ({ roomId, compiledPaper }) => {
    socket.to(roomId).emit('paper-deployed', compiledPaper);
    
    let connection;
    try {
      const startTime = roomStartTimes[roomId] || Date.now();
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      connection = await db.getConnection();
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.execute(
        'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, ?, ?)',
        [roomId, elapsedTime, 'problem_change', JSON.stringify(compiledPaper)]
      );
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) { 
      console.error("[SERVER ENGINE] Failed logging paper deployment:", err); 
    } finally { 
      if (connection) connection.release(); 
    }
  });

  socket.on('shift-paper-index', ({ roomId, index, starterCode }) => {
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
    let connection;
    try {
      const startTime = roomStartTimes[roomId] || Date.now();
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      connection = await db.getConnection();
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.execute(
        'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, ?, ?)',
        [roomId, elapsedTime, 'security_alert', `${violationType}: ${message}`]
      );
      const columnToUpdate = violationType === 'TAB_SWITCH' ? 'tab_switch_count' : 'paste_count';
      await connection.execute(`UPDATE interview_sessions SET ${columnToUpdate} = ${columnToUpdate} + 1 WHERE id = ?`, [roomId]);
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) { console.error(err); } finally { if (connection) connection.release(); }
  });

  socket.on('send-chat', async ({ roomId, message, sender }) => {
    socket.to(roomId).emit('receive-chat', { message, sender });
    let connection;
    try {
      const startTime = roomStartTimes[roomId] || Date.now();
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      connection = await db.getConnection();
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.execute(
        'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, ?, ?)',
        [roomId, elapsedTime, 'chat_msg', JSON.stringify({ message, sender })]
      );
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) { console.error(err); } finally { if (connection) connection.release(); }
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

server.listen(5001, () => console.log('Engine Core Online on Port 5001'));

   