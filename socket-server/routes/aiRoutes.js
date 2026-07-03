const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/evaluate', async (req, res) => {
  const { roomId, code, problemDescription, language, messages } = req.body;

  try {
    const interviewTranscript = messages
      .map(m => `${m.sender}: ${m.text}`)
      .join('\n');

    const mockAiScorecard = `
=========================================
      TECHNICAL ASSESSMENT REPORT        
=========================================
1. CODE EFFICIENCY & STRUCTURE
- Language: ${language}
- Summary: Code layout demonstrates reasonable algorithmic structure. Edge-case safety mechanisms could be optimized within loop conditionals.
- Time Complexity Profile: O(N) linear scan efficiency achieved.

2. COMMUNICATION & BEHAVIORAL MATRIX
- Profile: Clear articulation observed across interactive chat queries.
- Collaboration: Candidate actively confirmed logic paths before committing core text edits.

3. CONSTRUCTIVE ROADMAP FEEDBACK
- Consider refining variable scopes and modularizing the helper syntax structure to scale readability.
=========================================
`;

    const overallScore = 85; 
    const efficiencyFeedback = "O(N) single-pass structural time profiling.";
    const communicationFeedback = "Proactive feedback loops maintained over chat.";
    const constructiveFeedback = "Refine edge-case null parameters within iterative checks.";

    let connection = await db.getConnection();
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');

      await connection.execute(
        `INSERT INTO interview_analytics 
        (session_id, overall_score, code_efficiency, communication_rating, constructive_feedback) 
        VALUES (?, ?, ?, ?, ?)`,
        [roomId, overallScore, efficiencyFeedback, communicationFeedback, constructiveFeedback]
      );

      await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    } finally {
      if (connection) connection.release();
    }

    res.json({ evaluation: mockAiScorecard });

  } catch (err) {
    console.error("AI Evaluation compilation failed:", err);
    res.status(500).json({ error: "Failed to process interview token stream metrics." });
  }
});

module.exports = router;