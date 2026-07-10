const studentService = require('../services/studentService');

class StudentController {
  async getAnalytics(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    try {
      const analytics = await studentService.getStudentAnalytics();
      res.json(analytics);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudentController();