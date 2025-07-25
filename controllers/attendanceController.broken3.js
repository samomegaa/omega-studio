const pool = require('../config/db');

// Get today's attendance for current user
exports.getTodayAttendance = async (req, res) => {
  try {
    const { user } = req;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [user.id, today]
    );
    
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
};



// Clock In
    
exports.clockIn = async (req, res) => {
  try {
    console.log('Clock in request received');
    const { user } = req;
    const { location, notes } = req.body;
    
    console.log('User:', user);
    console.log('Location:', location);
    
    // ... rest of the code

    // Validate location is provided
    if (!location || location === 'Location not available' || location === 'Geolocation not supported') {
      return res.status(400).json({ 
        message: 'Location is required for clock in. Please enable location services.' 
      });
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const ip_address = req.ip || req.connection.remoteAddress;
    
    // Rest of the function remains the same...


    // Check if already clocked in
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND "date" = $2',
      [user.id, today]
    );
    
    if (existing.rows.length > 0 && existing.rows[0].clock_in_time) {
      return res.status(400).json({ message: 'Already clocked in for today' });
    }
    
    // Get attendance settings
    const settings = await pool.query('SELECT * FROM attendance_settings WHERE id = 1');
    const { office_start_time, late_mark_after } = settings.rows[0];
    
    // Calculate if late
    const officeStart = new Date(`${today}T${office_start_time}`);
    const lateThreshold = new Date(officeStart.getTime() + late_mark_after * 60000);
    const status = now > lateThreshold ? 'late' : 'present';
    
    // Insert or update attendance
// Around line 63, change the INSERT query to:
const result = await pool.query(`
  INSERT INTO attendance (user_id, "date", clock_in, status, location, ip_address, notes)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (user_id, "date") 
  DO UPDATE SET 
    clock_in = $3,
    status = $4,
    location = $5,
    ip_address = $6,
    notes = $7,
    updated_at = NOW()
  RETURNING *
`, [user.id, today, now, status, location, ip_address, notes || '']);

    
    res.json({
      message: status === 'late' ? 'Clocked in (Late)' : 'Clocked in successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Error clocking in' });
  }
};





// Clock Out
exports.clockOut = async (req, res) => {
  try {
    const { user } = req;
    const { notes, location } = req.body;  // Add location here
    
    // Validate location is provided
    if (!location || location === 'Location not available' || location === 'Geolocation not supported') {
      return res.status(400).json({ 
        message: 'Location is required for clock out. Please enable location services.' 
      });
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if clocked in
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [user.id, today]
    );
    
    if (existing.rows.length === 0 || !existing.rows[0].clock_in_time) {
      return res.status(400).json({ message: 'Not clocked in yet' });
    }
    
    if (existing.rows[0].clock_out_time) {
      return res.status(400).json({ message: 'Already clocked out for today' });
    }
    
    // Update attendance with location
    const result = await pool.query(`
      UPDATE attendance 
      SET clock_out_time = $1, 
          notes = CASE 
            WHEN notes IS NULL THEN $2 
            ELSE notes || ' | Clock out location: ' || $3
          END,
          updated_at = NOW()
      WHERE user_id = $4 AND date = $5
      RETURNING *
    `, [now, `Clock out location: ${location}`, location, user.id, today]);
    
    res.json({
      message: 'Clocked out successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Error clocking out' });
  }
};





// Start Break
exports.startBreak = async (req, res) => {
  try {
    const { user } = req;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [user.id, today]
    );
    
    if (existing.rows.length === 0 || !existing.rows[0].clock_in_time) {
      return res.status(400).json({ message: 'Not clocked in yet' });
    }
    
    if (existing.rows[0].break_start_time && !existing.rows[0].break_end_time) {
      return res.status(400).json({ message: 'Already on break' });
    }
    
    const result = await pool.query(`
      UPDATE attendance 
      SET break_start_time = $1, break_end_time = NULL, updated_at = NOW()
      WHERE user_id = $2 AND date = $3
      RETURNING *
    `, [now, user.id, today]);
    
    res.json({
      message: 'Break started',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ message: 'Error starting break' });
  }
};

// End Break
exports.endBreak = async (req, res) => {
  try {
    const { user } = req;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [user.id, today]
    );
    
    if (existing.rows.length === 0 || !existing.rows[0].break_start_time) {
      return res.status(400).json({ message: 'Not on break' });
    }
    
    const result = await pool.query(`
      UPDATE attendance 
      SET break_end_time = $1, updated_at = NOW()
      WHERE user_id = $2 AND date = $3
      RETURNING *
    `, [now, user.id, today]);
    
    res.json({
      message: 'Break ended',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ message: 'Error ending break' });
  }
};






exports.getAttendanceReport = async (req, res) => {
  try {
    const { user } = req;
    const { start_date, end_date, user_id } = req.query;
        
    // Check permissions
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    
    let query = `
      WITH ranked_attendance AS (
        SELECT 
          a.*,
          u.username,
          u.full_name,
          u.email,
          d.name as department_name,
          ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY d.id) as rn
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN user_departments ud ON u.id = ud.user_id
        LEFT JOIN departments d ON ud.department_id = d.id
        WHERE 1=1
    `;
 
    const queryParams = [];
    let paramCount = 1;
    
    // Filter by user if not admin
    if (!isAdmin && !isMadmin) {
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(user.id);
      paramCount++;
    } else if (user_id) {
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(user_id);
      paramCount++;
    }
    
    // Date filters
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
    
    query += `
      )
      SELECT * FROM ranked_attendance 
      WHERE rn = 1
      ORDER BY date DESC, user_id
    `;
    
       
    // Calculate stats properly
    const stats = {
      total_days: result.rows.length,
      present: result.rows.filter(r => r.status === 'present').length,
      late: result.rows.filter(r => r.status === 'late').length,
      absent: result.rows.filter(r => r.status === 'absent').length,
      leaves: result.rows.filter(r => r.status === 'leave').length
    };
    
    res.json({
      attendance: result.rows,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report' });
  }
};

    
    // Check permissions
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    
    let query = `
      WITH ranked_attendance AS (
        SELECT 
          a.*,
          u.username,
          u.full_name,
          u.email,
          d.name as department_name,
          ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY d.id) as rn
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN user_departments ud ON u.id = ud.user_id
        LEFT JOIN departments d ON ud.department_id = d.id
        WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Filter by user if not admin
    if (!isAdmin && !isMadmin) {
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(user.id);
      paramCount++;
    } else if (user_id && isAdmin) {
      query += ` AND a.user_id = $${paramCount}`;
      queryParams.push(user_id);
      paramCount++;
    } else if (isMadmin) {
      // Madmin sees only their department
      query += ` AND d.id IN (SELECT department_id FROM user_departments WHERE user_id = $${paramCount})`;
      queryParams.push(user.id);
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
    
    // Calculate statistics
    const stats = {
      total_days: result.rows.length,
      present: result.rows.filter(r => r.status === 'present').length,
      late: result.rows.filter(r => r.status === 'late').length,
      absent: result.rows.filter(r => r.status === 'absent').length,
      leaves: result.rows.filter(r => r.status === 'leave').length
    };
    
    res.json({
      attendance: result.rows,
      stats
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report' });
  }
};

// Leave request functions
exports.createLeaveRequest = async (req, res) => {
  try {
    const { user } = req;
    const { leave_type, start_date, end_date, reason } = req.body;
    
    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Check for existing leave requests in the same period
    const conflictCheck = await pool.query(`
      SELECT * FROM leave_requests 
      WHERE user_id = $1 
      AND status != 'rejected' 
      AND status != 'cancelled'
      AND ((start_date <= $2 AND end_date >= $2) 
           OR (start_date <= $3 AND end_date >= $3)
           OR (start_date >= $2 AND end_date <= $3))
    `, [user.id, start_date, end_date]);
    
    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Leave request already exists for this period' });
    }
    
    const result = await pool.query(`
      INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user.id, leave_type, start_date, end_date, reason]);
    
    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave_request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Error creating leave request' });
  }
};

// Get leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { user } = req;
    const { status } = req.query;
    
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    
    let query = `
      SELECT 
        lr.*,
        u.username,
        u.full_name,
        u.email,
        au.full_name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users au ON lr.approved_by = au.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    if (!isAdmin && !isMadmin) {
      query += ` AND lr.user_id = $${paramCount}`;
      queryParams.push(user.id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
};

// Approve/Reject leave request
exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { status, comments } = req.body;
    
    // Check permissions
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    const isMadmin = userRoles.includes('madmin') || user.role === 'madmin';
    
    if (!isAdmin && !isMadmin) {
      return res.status(403).json({ message: 'Not authorized to update leave requests' });
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const result = await pool.query(`
      UPDATE leave_requests 
      SET status = $1, 
          approved_by = $2, 
          approved_at = NOW(), 
          comments = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, user.id, comments, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // If approved, mark attendance as leave for the period
    if (status === 'approved') {
      const leave = result.rows[0];
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        await pool.query(`
          INSERT INTO attendance (user_id, date, status, notes)
          VALUES ($1, $2, 'leave', $3)
          ON CONFLICT (user_id, date) 
          DO UPDATE SET status = 'leave', notes = $3
        `, [leave.user_id, dateStr, `${leave.leave_type} leave`]);
      }
    }
    
    res.json({
      message: `Leave request ${status}`,
      leave_request: result.rows[0]
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
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update attendance settings (admin only)
exports.updateSettings = async (req, res) => {
  try {
    const { user } = req;
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const {
      office_start_time,
      office_end_time,
      late_mark_after,
      half_day_after,
      working_days
    } = req.body;
    
    const result = await pool.query(`
      UPDATE attendance_settings 
      SET office_start_time = COALESCE($1, office_start_time),
          office_end_time = COALESCE($2, office_end_time),
          late_mark_after = COALESCE($3, late_mark_after),
          half_day_after = COALESCE($4, half_day_after),
          working_days = COALESCE($5, working_days),
          updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `, [office_start_time, office_end_time, late_mark_after, half_day_after, working_days]);
    
    res.json({
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
