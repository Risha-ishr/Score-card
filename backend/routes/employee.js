const express = require('express');
const db      = require('../database');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

router.get('/scorecard', (req, res) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ error: 'Employee access required' });
  }

  const scorecard = db.prepare('SELECT * FROM scorecards WHERE employee_id = ?').get(req.user.id);
  if (!scorecard) return res.json({ scorecard: null, scores: [] });

  const scores = db.prepare(`
    SELECT sc.parameter_id, sc.score, p.name, p.description, p.weightage
    FROM   scores sc
    JOIN   parameters p ON sc.parameter_id = p.id
    WHERE  sc.scorecard_id = ?
    ORDER  BY p.id
  `).all(scorecard.id);

  res.json({ scorecard, scores });
});

module.exports = router;
