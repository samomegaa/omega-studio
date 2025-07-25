const pool = require('../config/db');

// Get all clients with department info
// Get all clients with department info


exports.getAllClients = async (req, res) => {
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
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    const isEngineer = userRoles.includes('engineer') || user.role === 'engineer';
    
    let query;
    let queryParams = [];
    
    if (isAdmin) {
      query = `
        SELECT 
          c.*,
          d.name as department_name,
          COALESCE(c.is_active, true) as status
        FROM clients c
        LEFT JOIN departments d ON c.department_id = d.id
        ORDER BY c.created_at DESC
      `;
    } else if (isMadmin || isEngineer) {
      query = `
        SELECT 
          c.*,
          d.name as department_name,
          COALESCE(c.is_active, true) as status
        FROM clients c
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE c.department_id IN (
          SELECT department_id FROM user_departments WHERE user_id = $1
        )
        ORDER BY c.created_at DESC
      `;
      queryParams = [user.id];
    } else {
      // Others see no clients - RETURN HERE, don't use result
      return res.json([]);
    }
    
    // NOW we can use result after the query
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients' });
  }
};
    // Log to debug
// Create new client
exports.createClient = async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    address, 
    department_id 
  } = req.body;
  
  const { user } = req;
  
  try {

// Extract roles - handle both array and single role cases
    const userRoles = user.roles || [user.role] || [];
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    
    if (isMadmin) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2',
        [user.id, department_id]
      );
      
      if (deptCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this department' });
      }
    }
    if (user.roles.includes('madmin')) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2',
        [user.id, department_id]
      );
      
      if (deptCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this department' });
      }
    }
    
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );
    
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }
    
    const result = await pool.query(`
      INSERT INTO clients (
        name, email, phone, address, department_id, created_by_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name, email, phone, address, department_id, user.id, true
    ]);
    
    res.status(201).json({
      message: 'Client created successfully',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Error creating client' });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    email, 
    phone, 
    address, 
    department_id,
    is_active 
  } = req.body;
  
  const { user } = req;
  
  try {
    const clientCheck = await pool.query(
      'SELECT department_id FROM clients WHERE id = $1',
      [id]
    );
    
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    if (user.roles.includes('madmin')) {
      const deptCheck = await pool.query(
        'SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2',
        [user.id, department_id || clientCheck.rows[0].department_id]
      );
      
      if (deptCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this client' });
      }
    }
    
    const result = await pool.query(`
      UPDATE clients 
      SET name = $1, email = $2, phone = $3, address = $4, 
          department_id = $5, is_active = $6
      WHERE id = $7
      RETURNING *
    `, [
      name, email, phone, address, department_id, is_active !== false, id
    ]);
    
    res.json({
      message: 'Client updated successfully',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Error updating client' });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  
  try {
    const projectCheck = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE client_id = $1',
      [id]
    );
    
    if (parseInt(projectCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete client with existing projects' 
      });
    }
    
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client' });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        d.name as department_name
      FROM clients c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Error fetching client' });
  }
};
