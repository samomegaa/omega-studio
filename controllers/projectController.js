const pool = require('../config/db');

// Get all projects with filters
exports.getAllProjects = async (req, res) => {
  try {
    // Fix for auth middleware compatibility
    if (!req.user && req.userId) {
      req.user = {
        id: req.userId,
        roles: req.userRoles || [],
        role: req.userRole
      };
    }
    
    const { user } = req;
const userRoles = user.roles || [user.role] || [];  // ADD THIS LINE    
const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    const isEngineer = userRoles.includes('engineer') || user.role === 'engineer';
    
    let query;
    let queryParams = [];
    
    if (isAdmin) {
      // Admin sees all projects
      query = `
        SELECT 
          p.*,
          c.name as client_name,
          c.email as client_email,
          d.name as department_name,
          u.username as engineer_name,
          u.full_name as engineer_full_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN users u ON p.assigned_to_id = u.id
        ORDER BY p.created_at DESC
      `;
    } else if (isMadmin) {
      // Madmin sees department projects
      query = `
        SELECT 
          p.*,
          c.name as client_name,
          c.email as client_email,
          d.name as department_name,
          u.username as engineer_name,
          u.full_name as engineer_full_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN users u ON p.assigned_to_id = u.id
        WHERE p.department_id IN (
          SELECT department_id FROM user_departments WHERE user_id = $1
        )
        ORDER BY p.created_at DESC
      `;
      queryParams = [user.id];
    } else if (isEngineer) {
      // Engineer sees assigned projects
      query = `
        SELECT 
          p.*,
          c.name as client_name,
          c.email as client_email,
          d.name as department_name,
          u.username as engineer_name,
          u.full_name as engineer_full_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN users u ON p.assigned_to_id = u.id
        WHERE p.assigned_to_id = $1
        ORDER BY p.created_at DESC
      `;
      queryParams = [user.id];
    } else {
      // Others see no projects
      return res.json([]);
    }
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

// Get available engineers for a department

exports.getEngineers = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    console.log('getEngineers called with departmentId:', departmentId, 'type:', typeof departmentId);
    
    // Return empty array if no valid departmentId
    if (!departmentId || departmentId === 'undefined' || departmentId === 'null' || departmentId === '') {
      console.log('No valid departmentId, returning empty array');
      return res.json([]);
    }
    
    // Parse and validate departmentId
    const deptIdNum = parseInt(departmentId, 10);
    if (isNaN(deptIdNum) || deptIdNum <= 0) {
      console.log('Invalid departmentId number:', deptIdNum);
      return res.json([]);
    }
    
    let query = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.full_name,
        u.email
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'engineer' AND u.status = 'active'
      AND u.id IN (
        SELECT user_id FROM user_departments WHERE department_id = $1
      )
      ORDER BY u.full_name, u.username
    `;
    
    console.log('Executing query with departmentId:', deptIdNum);
    const result = await pool.query(query, [deptIdNum]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ message: 'Error fetching engineers', error: error.message });
  }
};

// Create new project


exports.createProject = async (req, res) => {
  console.log('=== Creating Project ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  let { 
    title, 
    description,
    client_id, 
    department_id,
    assigned_to_id,
    status,
    start_date,
    end_date
  } = req.body;
  
// Convert empty strings to null for integer fields
  if (assigned_to_id === '') assigned_to_id = null;
  if (client_id === '') client_id = null;
  if (end_date === '') end_date = null;

  const { user } = req;
  
  try {
    console.log('Department ID:', department_id);
    console.log('User ID:', user.id);
    
    // DECLARE ALL VARIABLES FIRST
    const userRoles = user.roles || [user.role] || [];
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    const isEngineer = userRoles.includes('engineer') || user.role === 'engineer';
    
    // THEN USE THEM
    if ((isMadmin || isEngineer) && !department_id) {
      // Get user's department
      const deptResult = await pool.query(
        'SELECT department_id FROM user_departments WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      
      if (deptResult.rows.length > 0) {
        department_id = deptResult.rows[0].department_id;
      }
    }
    
    // Validate department access for madmin
    if (isMadmin) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2',
        [user.id, department_id]
      );
      
      if (deptCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this department' });
      }
    }
    
    // ... rest of the function



    // Create project
    const result = await pool.query(`
      INSERT INTO projects (
        title, description, client_id, department_id, assigned_to_id,
        status, start_date, end_date, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      title, description, client_id, department_id, assigned_to_id,
      status || 'active', start_date, end_date, user.id
    ]);
    
    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { 
    title,
    description,
    client_id, 
    department_id,
    assigned_to_id,
    status,
    start_date,
    end_date
  } = req.body;

// Convert empty strings to null for integer/date fields
  let assigned_to_id_clean = assigned_to_id === '' ? null : assigned_to_id;
  let client_id_clean = client_id === '' ? null : client_id;
  let end_date_clean = end_date === '' ? null : end_date

console.log('Original values:', { assigned_to_id, client_id, end_date });
  console.log('Cleaned values:', { assigned_to_id_clean, client_id_clean, end_date_clean });

  const { user } = req;
  
  try {





// ADD THESE LINES HERE
    const userRoles = user.roles || [user.role] || [];
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    

    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT department_id FROM projects WHERE id = $1',
      [id]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Validate department access for madmin
    
    
    if (isMadmin) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2',
        [user.id, department_id || projectCheck.rows[0].department_id]
      );
      
      if (deptCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
    }
    
    // Update project
    const result = await pool.query(`
      UPDATE projects 
      SET title = $1, description = $2, client_id = $3, department_id = $4,
          assigned_to_id = $5, status = $6, start_date = $7, end_date = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      title, description, client_id_clean, department_id, assigned_to_id_clean,
      status, start_date, end_date_clean, id
    ]);
    
    res.json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Only admin can delete projects
    if (!user.roles || !user.roles.includes('admin')) {
      return res.status(403).json({ 
        message: 'Access denied. Only administrators can delete projects.' 
      });
    }
    
    // Check if project exists
    const projectCheck = await pool.query(
      'SELECT id, title FROM projects WHERE id = $1',
      [id]
    );
    
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete the project
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
};


// Get project by ID
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        d.name as department_name,
        u.username as engineer_name,
        u.full_name as engineer_full_name,
        u.email as engineer_email
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.assigned_to_id = u.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
};
