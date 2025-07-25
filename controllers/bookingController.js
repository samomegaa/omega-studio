const pool = require('../config/db');

// Get all studios
exports.getAllStudios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM studios 
      WHERE status = 'active' 
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching studios:', error);
    res.status(500).json({ message: 'Error fetching studios' });
  }
};

// Get bookings for calendar view
exports.getBookings = async (req, res) => {
  try {
    const { start, end, studio_id } = req.query;
    const { user } = req;
    
   let query = `
      SELECT 
        b.id,
        b.booking_number,
        b.studio_id,
        b.project_id,
        b.client_id,
        b.department_id,
        TO_CHAR(b.date, 'YYYY-MM-DD') as date,
        b.start_time::text as start_time,
        b.end_time::text as end_time,
        b.status,
        b.purpose,
        b.notes,
        b.total_cost,
        b.created_by_id,
        s.name as studio_name,
        s.type as studio_type,
        p.title as project_title,
        c.name as client_name,
        u.full_name as booked_by_name,
        u.username as booked_by_username,
        d.name as department_name
      FROM bookings b
      LEFT JOIN studios s ON b.studio_id = s.id
      LEFT JOIN projects p ON b.project_id = p.id
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN users u ON b.created_by_id = u.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    if (start) {
      query += ` AND b.date >= $${paramCount}`;
      queryParams.push(start);
      paramCount++;
    }
    
    if (end) {
      query += ` AND b.date <= $${paramCount}`;
      queryParams.push(end);
      paramCount++;
    }
    
    if (studio_id) {
      query += ` AND b.studio_id = $${paramCount}`;
      queryParams.push(studio_id);
      paramCount++;
    }
    
    // Non-admin users only see their own bookings
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      query += ` AND b.created_by_id = $${paramCount}`;
      queryParams.push(user.id);
    }
    
    query += ' ORDER BY b.date, b.start_time';
    
    





const result = await pool.query(query, queryParams);
    
    // Transform to include full timestamps for calendar
    const bookingsWithTimestamps = result.rows.map(booking => {
      // Now date is already in YYYY-MM-DD format
      // and times are in HH:mm:ss format
      return {
        ...booking,
        start_time: `${booking.date}T${booking.start_time}`,
        end_time: `${booking.date}T${booking.end_time}`
      };
    });
    
    res.json(bookingsWithTimestamps);



  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

// Generate booking number
const generateBookingNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK${year}${month}${day}${random}`;
};

// Create new booking
exports.createBooking = async (req, res) => {
  const {
    studio_id,
    project_id,
    client_id,
    department_id,
    start_time,
    end_time,
    purpose,
    notes
  } = req.body;
  
  const { user } = req;
  
  try {
    // Extract date and time from datetime inputs
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (startDate.toDateString() !== endDate.toDateString()) {
      return res.status(400).json({ 
        message: 'Booking must start and end on the same day' 
      });
    }
    
    const date = startDate.toISOString().split('T')[0];
    const startTimeOnly = startDate.toTimeString().split(' ')[0];
    const endTimeOnly = endDate.toTimeString().split(' ')[0];
    
    // Check for conflicts
    const conflictCheck = await pool.query(`
      SELECT id FROM bookings 
      WHERE studio_id = $1 
      AND date = $2
      AND status != 'cancelled'
      AND (
        (start_time >= $3 AND start_time < $4) OR
        (end_time > $3 AND end_time <= $4) OR
        (start_time <= $3 AND end_time >= $4)
      )
    `, [studio_id, date, startTimeOnly, endTimeOnly]);
    
    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'This time slot is already booked' 
      });
    }
    
    // Calculate cost
    const studio = await pool.query(
      'SELECT hourly_rate FROM studios WHERE id = $1',
      [studio_id]
    );
    
    const hours = (endDate - startDate) / (1000 * 60 * 60);
    const total_cost = hours * (studio.rows[0]?.hourly_rate || 0);
    
    // Get user's department if not provided
    let bookingDeptId = department_id;
    if (!bookingDeptId) {
      const userDept = await pool.query(
        'SELECT department_id FROM user_departments WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      bookingDeptId = userDept.rows[0]?.department_id || 1; // Default to 1 if no dept
    }
    
    // Create booking with generated booking number
    const booking_number = generateBookingNumber();
    
    const result = await pool.query(`
      INSERT INTO bookings (
        booking_number, studio_id, project_id, client_id, department_id,
        date, start_time, end_time, purpose, notes,
        status, total_cost, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      booking_number,
      studio_id,
      project_id || null,
      client_id || null,
      bookingDeptId,
      date,
      startTimeOnly,
      endTimeOnly,
      purpose,
      notes,
      'confirmed',
      total_cost,
      user.id
    ]);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const {
    studio_id,
    project_id,
    client_id,
    start_time,
    end_time,
    purpose,
    notes,
    status
  } = req.body;
  
  const { user } = req;
  
  try {
    // Check ownership or admin
    const bookingCheck = await pool.query(
      'SELECT created_by_id, department_id FROM bookings WHERE id = $1',
      [id]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingCheck.rows[0];
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    if (!isAdmin && booking.created_by_id !== user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this booking' });
    }
    
    // Extract date and time if provided
    let date, startTimeOnly, endTimeOnly;
    if (start_time && end_time) {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      
      date = startDate.toISOString().split('T')[0];
      startTimeOnly = startDate.toTimeString().split(' ')[0];
      endTimeOnly = endDate.toTimeString().split(' ')[0];
      
      // Check for conflicts
      const conflictCheck = await pool.query(`
        SELECT id FROM bookings 
        WHERE studio_id = COALESCE($1, studio_id)
        AND date = $2
        AND id != $3
        AND status != 'cancelled'
        AND (
          (start_time >= $4 AND start_time < $5) OR
          (end_time > $4 AND end_time <= $5) OR
          (start_time <= $4 AND end_time >= $5)
        )
      `, [studio_id || booking.studio_id, date, id, startTimeOnly, endTimeOnly]);
      
      if (conflictCheck.rows.length > 0) {
        return res.status(400).json({ 
          message: 'This time slot conflicts with another booking' 
        });
      }
    }
    
    // Update booking
    const result = await pool.query(`
      UPDATE bookings 
      SET studio_id = COALESCE($1, studio_id),
          project_id = $2,
          client_id = $3,
          date = COALESCE($4, date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          purpose = COALESCE($7, purpose),
          notes = COALESCE($8, notes),
          status = COALESCE($9, status),
          updated_at = NOW()
      WHERE id = $10

RETURNING *
    `, [
      studio_id, project_id, client_id, date, startTimeOnly, endTimeOnly,
      purpose, notes, status, id
    ]);
    
    res.json({
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  try {
    // Check ownership or admin
    const bookingCheck = await pool.query(
      'SELECT created_by_id FROM bookings WHERE id = $1',
      [id]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingCheck.rows[0];
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    if (!isAdmin && booking.created_by_id !== user.id) {
      return res.status(403).json({ message: 'You do not have permission to cancel this booking' });
    }
    
    await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    );
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
};

// Get available time slots
exports.getAvailableSlots = async (req, res) => {
  const { studio_id, date } = req.query;
  
  try {
    // Get all bookings for the studio on the given date
    const bookings = await pool.query(`
      SELECT start_time, end_time 
      FROM bookings 
      WHERE studio_id = $1 
      AND date = $2::date
      AND status != 'cancelled'
      ORDER BY start_time
    `, [studio_id, date]);
    
    // Business hours: 8 AM to 10 PM
    const businessStart = 8;
    const businessEnd = 22;
    const availableSlots = [];
    
    let currentHour = businessStart;
    
    bookings.rows.forEach(booking => {
      const bookingStart = parseInt(booking.start_time.split(':')[0]);
      const bookingEnd = parseInt(booking.end_time.split(':')[0]);
      
      if (currentHour < bookingStart) {
        availableSlots.push({
          start: currentHour,
          end: bookingStart
        });
      }
      currentHour = Math.max(currentHour, bookingEnd);
    });
    
    if (currentHour < businessEnd) {
      availableSlots.push({
        start: currentHour,
        end: businessEnd
      });
    }
    
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Error fetching available slots' });
  }
};
