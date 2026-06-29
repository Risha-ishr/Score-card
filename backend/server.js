const express = require('express');
const cors    = require('cors');
require('./database'); // initialise & seed DB on startup

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/employee', require('./routes/employee'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n  Scorecard backend running → http://localhost:${PORT}`);
  console.log('  Admin     :  admin     / Admin@123');
  console.log('  Employees :  haroon    / Emp@1234');
  console.log('              abigail   / Emp@1234');
  console.log('              (see database.js for all 10)\n');
});
