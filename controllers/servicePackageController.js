const pool = require('../config/db');

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await pool.query(`
      SELECT sp.*, s.name as studio_name 
      FROM service_packages sp 
      JOIN studios s ON sp.studio_id = s.id 
      ORDER BY sp.studio_id, sp.sort_order
    `);
    res.json(packages.rows);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Error fetching packages' });
  }
};

// Create package
exports.createPackage = async (req, res) => {
  try {
    const { studio_id, package_name, description, price, duration, max_output, features, is_active } = req.body;
    
    // Get max sort_order for this studio
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max FROM service_packages WHERE studio_id = $1',
      [studio_id]
    );
    
    const newPackage = await pool.query(`
      INSERT INTO service_packages 
      (studio_id, package_name, description, price, duration, max_output, features, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [studio_id, package_name, description, price, duration, max_output, features, is_active, maxOrder.rows[0].max + 1]
    );
    
    res.status(201).json(newPackage.rows[0]);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ message: 'Error creating package' });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { package_name, description, price, duration, max_output, features, is_active } = req.body;
    
    const updated = await pool.query(`
      UPDATE service_packages 
      SET package_name = $1, description = $2, price = $3, duration = $4, 
          max_output = $5, features = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [package_name, description, price, duration, max_output, features, is_active, id]
    );
    
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Error updating package' });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await pool.query(
      'DELETE FROM service_packages WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Error deleting package' });
  }
};

// Update sort order
exports.updateSortOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;
    
    // Get current package
    const current = await pool.query(
      'SELECT * FROM service_packages WHERE id = $1',
      [id]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    const pkg = current.rows[0];
    const newOrder = direction === 'up' ? pkg.sort_order - 1 : pkg.sort_order + 1;
    
    // Get adjacent package
    const adjacent = await pool.query(
      'SELECT * FROM service_packages WHERE studio_id = $1 AND sort_order = $2',
      [pkg.studio_id, newOrder]
    );
    
    if (adjacent.rows.length > 0) {
      // Swap sort orders
      await pool.query('BEGIN');
      await pool.query(
        'UPDATE service_packages SET sort_order = $1 WHERE id = $2',
        [pkg.sort_order, adjacent.rows[0].id]
      );
      await pool.query(
        'UPDATE service_packages SET sort_order = $1 WHERE id = $2',
        [newOrder, pkg.id]
      );
      await pool.query('COMMIT');
    }
    
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Update sort order error:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
};

module.exports = exports;
