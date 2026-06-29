const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'scorecard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
    name TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS parameters (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    weightage INTEGER NOT NULL CHECK(weightage IN (1, 2, 3))
  );

  CREATE TABLE IF NOT EXISTS scorecards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL UNIQUE,
    applicant_name TEXT,
    client TEXT,
    position TEXT,
    jd_shared INTEGER DEFAULT 0,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scorecard_id INTEGER NOT NULL,
    parameter_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
    UNIQUE(scorecard_id, parameter_id),
    FOREIGN KEY (scorecard_id) REFERENCES scorecards(id),
    FOREIGN KEY (parameter_id) REFERENCES parameters(id)
  );
`);

function makeUsername(name) {
  const parts    = name.trim().toLowerCase().split(/\s+/);
  const base     = parts[0][0] + parts[parts.length - 1]; // first letter of first name + last name
  let username   = base.replace(/[^a-z0-9]/g, '');
  let counter    = 1;
  while (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    username = base.replace(/[^a-z0-9]/g, '') + counter++;
  }
  return username;
}

const paramCount = db.prepare('SELECT COUNT(*) as count FROM parameters').get();
if (paramCount.count === 0) {
  const insertParam = db.prepare('INSERT INTO parameters (id, name, description, weightage) VALUES (?, ?, ?, ?)');
  const params = [
    [1,  'Urgency',                                  'Urgency for the candidate', 1],
    [2,  'Actively Looking Out',                     'Other positions/offers',    1],
    [3,  'Joining/Start Date',                       'Notice dependency',         1],
    [4,  'Salary/Earnings Expectations',             '',                          2],
    [5,  'Availability & Accessibility on Calls',    '',                          2],
    [6,  'WorkEmotion Grid (WEG) & W/L Balance',     '',                          2],
    [7,  'Communication',                            '',                          3],
    [8,  'Untoward/Emergency Scenarios',             '',                          2],
    [9,  'Completeness',                             'Meets JD',                  2],
    [10, 'Risk to Joining',                          'Other offers',              1],
  ];
  params.forEach(p => insertParam.run(...p));
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)'
  );
  const adminPass = bcrypt.hashSync('Admin@123', 10);
  const empPass   = bcrypt.hashSync('Emp@1234',  10);

  insertUser.run('admin', adminPass, 'admin', 'Admin User', 'admin@scorecard.com');

  const employeeNames = [
    'Haroon Ali Khan',
    'Abigail Gonzales',
    'Tehreen Saba',
    'Mohammad Khalid',
    'Pratik Soni',
    'Salman Khan',
    'Dilshad Salim',
    'Employee Eight',
    'Employee Nine',
    'Employee Ten',
  ];

  employeeNames.forEach(name => {
    const username = makeUsername(name);
    const email    = username + '@scorecard.com';
    insertUser.run(username, empPass, 'employee', name, email);
  });
}

module.exports = db;
module.exports.makeUsername = makeUsername;
