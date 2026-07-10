const db = require('../config/db');

class StudentService {
  async getStudentAnalytics() {
    const [rows] = await db.execute(`
      SELECT s.id, s.tab_switch_count, s.paste_count, a.overall_score, a.completed_at 
      FROM interview_sessions s
      LEFT JOIN interview_analytics a ON s.id = a.session_id
      WHERE s.session_type = 'mock'
      ORDER BY s.created_at DESC
    `);
    return rows;
  }
}

module.exports = new StudentService();