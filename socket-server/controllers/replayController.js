const replayService = require('../services/replayService');

class ReplayController {
  async getReplayData(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const { sessionId } = req.params;

    try {
      const timelineEvents = await replayService.getSessionTimeline(sessionId);
      res.json(timelineEvents);
    } catch (err) {
      console.error("[REPLAY CONTROLLER] Timeline stream fetch fault:", err);
      res.status(500).json([]);
    }
  }
}

module.exports = new ReplayController();