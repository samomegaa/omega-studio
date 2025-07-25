require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'omega_studio_prod',
  user: 'omega_admin',
  password: 'OmegaStudio2025'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Success! Database time:', res.rows[0].now);
  }
  pool.end();
});
