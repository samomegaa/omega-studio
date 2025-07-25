require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('Testing login for admin@omegastudio.com...');
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  try {
    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@omegastudio.com']
    );
    
    console.log('User found:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User status:', user.status);
      console.log('Username:', user.username);
      
      // Test password
      const validPassword = await bcrypt.compare('Admin@123!', user.password);
      console.log('Password valid:', validPassword);
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

testLogin();
