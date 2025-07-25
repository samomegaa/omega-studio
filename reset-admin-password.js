require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    // Generate new password hash
    const password = 'Admin@123!';
    const hash = await bcrypt.hash(password, 12);
    
    console.log('Generating new password hash...');
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Update admin password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username, email',
      [hash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('Password updated successfully for user:', result.rows[0].username);
      console.log('Email:', result.rows[0].email);
      
      // Test the password immediately
      const testResult = await pool.query('SELECT password FROM users WHERE username = $1', ['admin']);
      const isValid = await bcrypt.compare(password, testResult.rows[0].password);
      console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('Admin user not found!');
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

resetAdminPassword();
