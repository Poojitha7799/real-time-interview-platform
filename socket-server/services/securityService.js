const db = require('../config/db');

class SecurityService {
  async handleViolation({ roomId, violationType, message, elapsedSeconds }) {
    // 1. Persist the violation alert payload to the replay stream timeline
    await db.execute(
      'INSERT INTO replay_events (session_id, elapsed_time_seconds, event_type, event_data) VALUES (?, ?, "security_alert", ?)',
      [roomId, elapsedSeconds, `${violationType}: ${message}`]
    );

    // 2. Increment target counts dynamically based on structural violation rules
    const columnToUpdate = violationType === 'TAB_SWITCH' ? 'tab_switch_count' : 'paste_count';
    
    await db.execute(
      `UPDATE interview_sessions SET ${columnToUpdate} = ${columnToUpdate} + 1 WHERE id = ?`,
      [roomId]
    );
  }
}

module.exports = new SecurityService();