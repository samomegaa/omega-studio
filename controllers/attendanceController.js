const pool = require('../config/db');

// Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const { user } = req;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND "date" = $2',
      [user.id, today]
    );
    
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
};

// Clock in
exports.clockIn = async (req, res) => {
  try {
    const { user } = req;
    const { location, notes } = req.body;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if already clocked in
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND "date" = $2',
      [user.id, today]
    );
    
    if (existing.rows.length > 0 && existing.rows[0].clock_in) {
      return res.status(400).json({ message: 'Already clocked in for today' });
    }
    
    // Simple clock in
    const result = await pool.query(`
      INSERT INTO attendance (user_id, "date", clock_in, status, location, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, "date") 
      DO UPDATE SET 
        clock_in = $3,
        status = $4,
        location = $5,
        notes = $6,
        updated_at = NOW()
      RETURNING *
    `, [user.id, today, now, 'present', location || '', notes || '']);
    
    res.json({ message: 'Clocked in successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Error clocking in' });
  }
};

// Clock out
exports.clockOut = async (req, res) => {
  try {
    const { user } = req;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'UPDATE attendance SET clock_out = NOW() WHERE user_id = $1 AND "date" = $2 RETURNING *',
      [user.id, today]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No clock in record found for today' });
    }
    
    res.json({ message: 'Clocked out successfully', attendance: result.rows[0] });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Error clocking out' });
  }
};


// Get attendance report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { user } = req;
    const { start_date, end_date, user_id } = req.query;
    
    // Check if admin
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    let query = `
      SELECT DISTINCT
        a.*,
        u.username,
        u.full_name,
        u.email
        FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // If not admin, only show own attendance
    if (!isAdmin) {
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(user.id);
      paramCount++;
    } else if (user_id && user_id !== '' && user_id !== 'undefined') {
      // Admin can filter by specific user
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(parseInt(user_id));
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND a.date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND a.date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY a.date DESC, u.full_name';
    
    const result = await pool.query(query, queryParams);
    
    // Get unique users for dropdown (admin only)
    let users = [];
    if (isAdmin) {
      const usersResult = await pool.query(
        'SELECT id, full_name, username FROM users  ORDER BY full_name'
      );
      users = usersResult.rows;
    }
    
    res.json({
      attendance: result.rows,
      users: users,
      stats: {
        total_days: result.rows.length,
        present: result.rows.filter(r => r.status === 'present').length,
        late: result.rows.filter(r => r.status === 'late').length,
        absent: 0,
        leaves: 0
      }
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report' });
  }
};

// Stub functions for other routes
exports.startBreak = async (req, res) => {
  res.status(501).json({ message: 'Break feature coming soon' });
};

exports.endBreak = async (req, res) => {
  res.status(501).json({ message: 'Break feature coming soon' });
};



// Get leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { user } = req;
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    let query = `
      SELECT lr.*, u.full_name, u.username
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (!isAdmin) {
      query += ' AND lr.user_id = $1';
      queryParams.push(user.id);
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
};

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const { user } = req;
    const { leave_type, start_date, end_date, reason } = req.body;
    
    const result = await pool.query(`
      INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [user.id, leave_type, start_date, end_date, reason]);
    
    res.json({ 
      message: 'Leave request submitted successfully', 
      leaveRequest: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Error creating leave request' });
  }
};

// Update leave request status (admin only)
exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { status } = req.body;
    
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const result = await pool.query(`
      UPDATE leave_requests 
      SET status = $1, approved_by = $2, approved_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, user.id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    res.json({ 
      message: 'Leave request updated successfully', 
      leaveRequest: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Error updating leave request' });
  }
};


// Get attendance settings
exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance_settings WHERE id = 1');
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      res.json({
        office_start_time: '09:00',
        office_end_time: '18:30',
        late_mark_after_minutes: 15,
        half_day_after_minutes: 240
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update attendance settings (admin only)
exports.updateSettings = async (req, res) => {
  try {
    const { user } = req;
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { 
      office_start_time, 
      office_end_time, 
      late_mark_after,
      half_day_after 
    } = req.body;
    
    // Insert or update settings
    const result = await pool.query(`
      INSERT INTO attendance_settings (id, office_start_time, office_end_time, late_mark_after, half_day_after)
      VALUES (1, $1, $2, $3, $4)
      ON CONFLICT (id) 
      DO UPDATE SET 
        office_start_time = $1,
        office_end_time = $2,
        late_mark_after = $3,
        half_day_after = $4
      RETURNING *
    `, [office_start_time, office_end_time, late_mark_after, half_day_after]);
    
    res.json({ 
      message: 'Settings updated successfully', 
      settings: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
