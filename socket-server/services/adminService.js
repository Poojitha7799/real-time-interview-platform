const crypto = require('crypto');
const db = require('../config/db');

class AdminService {
  async fetchLiveSessions() {
    const [rows] = await db.execute(`
      SELECT id, candidate_email, interviewer_email, scheduled_date, scheduled_time 
      FROM interview_sessions 
      WHERE session_type = 'live' 
      ORDER BY created_at DESC
    `);
    return rows;
  }

  async fetchAllProblems() {
    const [rows] = await db.execute('SELECT * FROM coding_problems');
    return rows;
  }

  async scheduleSession({ candidateEmail, interviewerEmail, scheduledDate, scheduledTime }) {
    const rawUuid = crypto.randomUUID();
    const secureRoomId = `live-${rawUuid.substring(0, 8)}`; 

    const [userRows] = await db.execute(
      'SELECT name, department, skills FROM users WHERE email = ? AND role = "candidate"',
      [candidateEmail]
    );

    let candidateName = 'Unregistered Candidate';
    let academicDept = 'General Engineering';
    let verifiedSkills = 'Not Provided';

    if (userRows.length > 0) {
      candidateName = userRows[0].name || candidateName;
      academicDept = userRows[0].department || academicDept;
      verifiedSkills = userRows[0].skills || verifiedSkills;
    }

    await db.execute(
      `INSERT INTO interview_sessions 
      (id, session_type, candidate_email, interviewer_email, scheduled_date, scheduled_time, candidate_name, academic_dept, verified_skills, created_at) 
      VALUES (?, 'live', ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [secureRoomId, candidateEmail, interviewerEmail, scheduledDate, scheduledTime, candidateName, academicDept, verifiedSkills]
    );

    return secureRoomId;
  }
}

module.exports = new AdminService();