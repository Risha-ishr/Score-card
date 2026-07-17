const express  = require('express');
const multer   = require('multer');
const XLSX     = require('xlsx');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const dns      = require('dns').promises;
const db       = require('../database');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { makeUsername } = require('../database');

const router = express.Router();
router.use(authenticate, requireAdmin);

async function domainHasMx(email) {
  try {
    const domain = email.trim().split('@')[1];
    if (!domain) return false;
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

router.get('/parameters', (req, res) => {
  res.json(db.prepare('SELECT * FROM parameters ORDER BY id').all());
});

router.get('/employees', (req, res) => {
  const search = req.query.search?.trim();
  const like   = search ? `%${search}%` : null;

  let query = `
    SELECT
      u.id, u.username, u.name, u.email,
      s.id            AS scorecard_id,
      s.applicant_name, s.client, s.position, s.updated_at,
      ROUND(
        (SELECT SUM(sc.score * (4 - p.weightage))
         FROM   scores sc
         JOIN   parameters p ON sc.parameter_id = p.id
         WHERE  sc.scorecard_id = s.id
        ) * 100.0 / 115, 1
      ) AS weighted_pct
    FROM  users u
    LEFT JOIN scorecards s ON s.employee_id = u.id
    WHERE u.role = 'employee'
  `;

  const params = [];
  if (like) {
    query += ` AND (u.name LIKE ? OR s.applicant_name LIKE ? OR s.client LIKE ? OR s.position LIKE ?)`;
    params.push(like, like, like, like);
  }
  query += ` ORDER BY u.id`;

  res.json(db.prepare(query).all(...params));
});

router.get('/employees/:id/scorecard', (req, res) => {
  const employee = db.prepare(
    'SELECT id, username, name, email FROM users WHERE id = ? AND role = ?'
  ).get(req.params.id, 'employee');
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const scorecard = db.prepare('SELECT * FROM scorecards WHERE employee_id = ?').get(req.params.id);
  if (!scorecard) return res.json({ employee, scorecard: null, scores: [] });

  const scores = db.prepare(`
    SELECT sc.parameter_id, sc.score, p.name, p.description, p.weightage
    FROM   scores sc
    JOIN   parameters p ON sc.parameter_id = p.id
    WHERE  sc.scorecard_id = ?
    ORDER  BY p.id
  `).all(scorecard.id);

  res.json({ employee, scorecard, scores });
});

router.post('/employees/:id/scorecard', async (req, res) => {
  const { employee_name, email, applicant_name, client, position, jd_shared, jd_shared_date, remarks, scores } = req.body;

  if (email && !(await domainHasMx(email))) {
    return res.status(400).json({ error: 'Email domain does not exist or cannot receive emails.' });
  }

  const employee = db.prepare(
    'SELECT id FROM users WHERE id = ? AND role = ?'
  ).get(req.params.id, 'employee');
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const save = db.transaction(() => {
    if (employee_name || email) {
      const fields = [];
      const vals   = [];
      if (employee_name) { fields.push('name=?');  vals.push(employee_name.trim()); }
      if (email)         { fields.push('email=?'); vals.push(email.trim()); }
      vals.push(req.params.id);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id=?`).run(...vals);
    }

    let sc = db.prepare('SELECT id FROM scorecards WHERE employee_id = ?').get(req.params.id);
    if (sc) {
      db.prepare(`
        UPDATE scorecards
        SET applicant_name=?, client=?, position=?, jd_shared=?, jd_shared_date=?, remarks=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE employee_id=?
      `).run(applicant_name, client, position, jd_shared ? 1 : 0, jd_shared_date || null, remarks, req.params.id);
    } else {
      const r = db.prepare(`
        INSERT INTO scorecards (employee_id, applicant_name, client, position, jd_shared, jd_shared_date, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.params.id, applicant_name, client, position, jd_shared ? 1 : 0, jd_shared_date || null, remarks);
      sc = { id: r.lastInsertRowid };
    }

    if (Array.isArray(scores) && scores.length) {
      const upsert = db.prepare(`
        INSERT INTO scores (scorecard_id, parameter_id, score) VALUES (?, ?, ?)
        ON CONFLICT(scorecard_id, parameter_id) DO UPDATE SET score = excluded.score
      `);
      scores.forEach(s => upsert.run(sc.id, s.parameter_id, s.score));
    }
    return sc;
  });

  const sc = save();
  res.json({ success: true, scorecard_id: sc.id });
});

router.post('/upload-excel', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb   = XLSX.readFile(req.file.path);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

    // Column indices (0-based) matching the Excel layout:
    // 0:Sr 1:Applicant 2:Client 3:Position 4:JDShared
    // 5:Urgency 6:ActivelyLooking 7:JoiningDate 8:Salary 9:Availability
    // 10:WEG 11:Fillability 12:Untoward 13:Completeness 14:RiskToJoining
    const PARAM_COLS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    const processRow = db.transaction((row) => {
      const applicantName = row[1];
      if (!applicantName || typeof applicantName !== 'string') return null;

      let employee = db.prepare(
        "SELECT id FROM users WHERE role = 'employee' AND LOWER(TRIM(name)) = LOWER(TRIM(?))"
      ).get(applicantName);

      let isNew = false;
      if (!employee) {
        const username = makeUsername(applicantName);
        const password = bcrypt.hashSync('Emp@1234', 10);
        const email = username + '@scorecard.com';
        const r = db.prepare(
          'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)'
        ).run(username, password, 'employee', applicantName.trim(), email);
        employee = { id: r.lastInsertRowid };
        isNew = true;
      }

      let sc = db.prepare('SELECT id FROM scorecards WHERE employee_id = ?').get(employee.id);
      if (sc) {
        db.prepare(`
          UPDATE scorecards
          SET applicant_name=?, client=?, position=?, jd_shared=?, updated_at=CURRENT_TIMESTAMP
          WHERE employee_id=?
        `).run(applicantName, row[2] || '', row[3] || '',
               String(row[4]).toLowerCase() === 'yes' ? 1 : 0, employee.id);
      } else {
        const r = db.prepare(`
          INSERT INTO scorecards (employee_id, applicant_name, client, position, jd_shared)
          VALUES (?, ?, ?, ?, ?)
        `).run(employee.id, applicantName, row[2] || '', row[3] || '',
               String(row[4]).toLowerCase() === 'yes' ? 1 : 0);
        sc = { id: r.lastInsertRowid };
      }

      const upsert = db.prepare(`
        INSERT INTO scores (scorecard_id, parameter_id, score) VALUES (?, ?, ?)
        ON CONFLICT(scorecard_id, parameter_id) DO UPDATE SET score = excluded.score
      `);
      PARAM_COLS.forEach((colIdx, paramIdx) => {
        const score = parseInt(row[colIdx]);
        if (score >= 1 && score <= 5) upsert.run(sc.id, paramIdx + 1, score);
      });

      return { name: applicantName, status: isNew ? 'created' : 'updated' };
    });

    const results = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i] || !data[i][1]) continue;
      const r = processRow(data[i]);
      if (r) results.push(r);
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

module.exports = router;
