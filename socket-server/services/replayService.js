const db = require('../config/db');

class ReplayService {
  async getSessionTimeline(sessionId) {
    if (!sessionId) {
      const error = new Error('Target tracking timeline room criteria parameter missing.');
      error.statusCode = 400;
      throw error;
    }

    const [rows] = await db.execute(
      'SELECT elapsed_time_seconds, event_type, event_data FROM replay_events WHERE session_id = ? ORDER BY elapsed_time_seconds ASC',
      [sessionId]
    );
    
    return rows;
  }
}

module.exports = new ReplayService();