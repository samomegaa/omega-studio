const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users with roles and departments
exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.phone,
        u.status,
        u.created_at,
        array_agg(DISTINCT r.name) as roles,
        array_agg(DISTINCT d.name) as departments,
        array_agg(DISTINCT r.id) as role_ids,
        array_agg(DISTINCT d.id) as department_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN user_departments ud ON u.id = ud.user_id
      LEFT JOIN departments d ON ud.department_id = d.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const users = result.rows.map(user => ({
      ...user,
      roles: user.roles.filter(r => r !== null),
      departments: user.departments.filter(d => d !== null),
      role_ids: user.role_ids.filter(r => r !== null),
      department_ids: user.department_ids.filter(d => d !== null)
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { 
    username, 
    email, 
    full_name, 
    phone, 
    status,
    roles,
    departments,
    password 
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update basic user info
    let updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, full_name = $3, phone = $4, status = $5
      WHERE id = $6
    `;
    
    await client.query(updateQuery, [username, email, full_name, phone, status, id]);
    
    // Update password if provided
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
    }
// Reset user password
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'UPDATE users SET password = $1, last_password_change = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

    
    // Update roles
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    
    // Always ensure staff role is included
    const staffRole = await client.query('SELECT id FROM roles WHERE name = $1', ['staff']);
    const staffRoleId = staffRole.rows[0].id;
    
    // Combine selected roles with staff role
    const allRoles = [...new Set([...(roles || []), staffRoleId])];
    
    for (const roleId of allRoles) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [id, roleId]
      );
    }
    
    // Update departments
    await client.query('DELETE FROM user_departments WHERE user_id = $1', [id]);
    
    if (departments && departments.length > 0) {
      for (const deptId of departments) {
        await client.query(
          'INSERT INTO user_departments (user_id, department_id) VALUES ($1, $2)',
          [id, deptId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  } finally {
    client.release();
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  
  // Prevent deleting the admin user
  if (id === '1') {
    return res.status(400).json({ message: 'Cannot delete the system administrator' });
  }
  
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['active', id]
    );
    
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Error approving user' });
  }
};

// Get roles
exports.getRoles = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description FROM roles ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles' });
  }
};

// Get departments
exports.getDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM departments ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Error fetching departments' });
  }
};

// Create user (admin creating users directly)
exports.createUser = async (req, res) => {
  const { username, email, password, full_name, phone, roles, departments, status } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await client.query(`
      INSERT INTO users (username, email, password, full_name, phone, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [username, email, hashedPassword, full_name, phone, status || 'active']);
    
    const userId = userResult.rows[0].id;
    
    // Assign roles (always include staff role)
    const staffRole = await client.query('SELECT id FROM roles WHERE name = $1', ['staff']);
    const staffRoleId = staffRole.rows[0].id;
    const allRoles = [...new Set([...(roles || []), staffRoleId])];
    
    for (const roleId of allRoles) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, roleId]
      );
    }
    
    // Assign departments
    if (departments && departments.length > 0) {
      for (const deptId of departments) {
        await client.query(
          'INSERT INTO user_departments (user_id, department_id) VALUES ($1, $2)',
          [userId, deptId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: userId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  } finally {
    client.release();
  }
};
// Reset user password
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
