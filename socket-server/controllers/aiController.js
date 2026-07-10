const aiService = require('../services/aiService');

class AiController {
  async evaluateSession(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const { roomId, code, problemDescription, language, messages } = req.body;

    try {
      const evaluationReport = await aiService.generateAndSaveEvaluation({
        roomId,
        language,
        messages
      });
      res.json({ evaluation: evaluationReport });
    } catch (err) {
      console.error("[AI CONTROLLER] Evaluation processing fault:", err);
      res.status(500).json({ error: "Failed to process interview token stream metrics." });
    }
  }
}

module.exports = new AiController();