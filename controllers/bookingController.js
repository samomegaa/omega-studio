const pool = require('../config/db');
//const { sendBookingEmails } = require('../utils/emailService');

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

// Get service packages for a studio
exports.getServicePackages = async (req, res) => {
  try {
    const { service_type } = req.params;
    
    // Map service type to studio type
    const studioTypeMap = {
      'recording': 'recording',
      'photography': 'photography',
      'outside-recording': 'outside'
    };
    
    const studioType = studioTypeMap[service_type];
console.log('Studio type:', studioType); // ADD THIS    
if (!studioType) {
      return res.status(400).json({ message: 'Invalid service type' });
    }
    
    // Get packages for the studio
    const packages = await pool.query(`
      SELECT 
        sp.*,
        s.name as studio_name,
        s.type as studio_type
      FROM service_packages sp
      JOIN studios s ON sp.studio_id = s.id
      WHERE s.type = $1 AND sp.is_active = true
      ORDER BY sp.sort_order
    `, [studioType]);
    
    res.json({
      service_type,
      packages: packages.rows
    });
    
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Error fetching service packages' });
  }
};


    
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


// Public booking request (for clients)
exports.createPublicBooking = async (req, res) => {
  try {
    const {
      service_type, // 'recording', 'photography', 'outside-recording'
      event_type,   // specific service like 'Wedding Coverage'
      date,
      duration,
      location,
      notes,
      client_name,
      client_email,
      client_phone
    } = req.body;

    // Validate required fields
    if (!service_type || !date || !client_name || !client_email || !client_phone) {
      return res.status(400).json({ 
        message: 'Please provide all required information' 
      });
    }




exports.testBooking = async (req, res) => {
  try {
    // Test 1: Simple client creation
    //const client = await pool.query(
     // "INSERT INTO clients (name, email, phone, created_by_id) VALUES ('Test', 'test@test.com', '1234', NULL) RETURNING id"
//    );
    
    // Test 2: Simple booking creation
    //const booking = await pool.query(
     // `INSERT INTO bookings 
      // (booking_number, client_id, studio_id, department_id, date, start_time, end_time, status, created_by_id) 
      // VALUES ('TEST123', $1, 6, 2, '2025-07-28', '12:00:00', '14:00:00', 'pending', NULL) 
      // RETURNING id`,
     // [client.rows[0].id]
   // );
    
    res.json({ success: true, client_id: client.rows[0].id, booking_id: booking.rows[0].id });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
};
    // Check if client exists or create new
    let clientResult = await pool.query(
      'SELECT id FROM clients WHERE email = $1',
      [client_email]
    );

    let client_id;
    
    if (clientResult.rows.length === 0) {
      // Create new client
      const newClient = await pool.query(
        `INSERT INTO clients (name, email, phone, created_by_id) 
         VALUES ($1, $2, $3,  NULL) 
         RETURNING id`,
        [client_name, client_email, client_phone]
      );
      client_id = newClient.rows[0].id;
    } else {
      client_id = clientResult.rows[0].id;
    }


// Get studio by type instead of hardcoded ID
const studioTypeMap = {
  'recording': 'recording',
  'photography': 'photography',
  'outside-recording': 'outside'
};

const studioType = studioTypeMap[service_type];

// Look up studio ID from database
const studioResult = await pool.query(
  'SELECT id FROM studios WHERE type = $1 AND status = $2 LIMIT 1',
  [studioType, 'active']
);
console.log('Studio result:', studioResult.rows); // ADD THIS
if (studioResult.rows.length === 0) {
  return res.status(400).json({ message: 'Studio service not available' });
}

// Get studio ID
const studio_id = studioResult.rows[0].id;

// Map studio to department (adjust as needed)
const departmentMap = {
  5: 1,  // Recording Studio -> Recording Department
  6: 2,  // Photo Studio -> Photo Department  
  7: 3   // Outside Recording -> Outside Department
};
const department_id = departmentMap[studio_id] || 1;

// Calculate dates and times
const startDate = new Date(date);
const endDate = new Date(startDate);
endDate.setHours(endDate.getHours() + parseInt(duration || 1));

// Format for PostgreSQL
const bookingDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
const startTime = startDate.toTimeString().split(' ')[0];   // HH:MM:SS
const endTime = endDate.toTimeString().split(' ')[0];       // HH:MM:SS

// Remove the console.log entirely, or fix it:
console.log('Query executed successfully');

// Create booking - include booking_number
const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

const booking = await pool.query(
  `INSERT INTO bookings 
   (booking_number, client_id, studio_id, department_id, date, start_time, end_time, status, notes, created_by_id) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NULL) 
   RETURNING *`,
  [bookingNumber, client_id, studio_id, department_id, bookingDate, startTime, endTime, 
   `Event Type: ${event_type}\nLocation: ${location || 'Studio'}\n${notes || ''}`]
);

    // Send confirmation email (implement based on your email service)
    
// Send confirmation emails
const bookingData = {
  ...booking.rows[0],
  service_type,
  event_type,
  date,
  duration,
  location,
  notes
};

const clientData = {
  name: client_name,
  email: client_email,
  phone: client_phone
};

//await sendBookingEmails(bookingData, clientData);
// await sendBookingConfirmationEmail(client_email, booking.rows[0]);

    res.status(201).json({
      message: 'Booking request submitted successfully! We will contact you shortly to confirm.',
      booking: booking.rows[0]
    });

  } catch (error) {
    console.error('Public booking error:', error);
    res.status(500).json({ message: 'Error creating booking request' });
  }
};



// Get available time slots for a specific date and studio
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, service_type, duration = 1 } = req.query;

    if (!date || !service_type) {
      return res.status(400).json({ 
        message: 'Please provide date and service type' 
      });
    }

    // Get studio by type
    const studioTypeMap = {
      'recording': 'recording',
      'photography': 'photography',
      'outside-recording': 'outside'
    };

    const studioType = studioTypeMap[service_type];
    const studioResult = await pool.query(
      'SELECT id FROM studios WHERE type = $1 AND status = $2 LIMIT 1',
      [studioType, 'active']
    );

    if (studioResult.rows.length === 0) {
      return res.status(400).json({ message: 'Studio not available' });
    }

    const studio_id = studioResult.rows[0].id;

// Get all bookings for the date
const bookings = await pool.query(
  `SELECT start_time, end_time, status 
   FROM bookings 
   WHERE studio_id = $1 
   AND date = $2::date
   AND status IN ('confirmed', 'in-progress', 'pending')
   ORDER BY start_time`,
  [studio_id, date]
);

console.log('Bookings found:', bookings.rows.length); // ADD THIS
    // Generate available slots
    const slots = [];
    const slotDuration = parseInt(duration);
    
    // Operating hours: 8 AM to 8 PM (configurable)
    const startHour = 8;
    const endHour = 20;
    
    // For outside recording, we might have different hours
    const operatingHours = {
      'recording': { start: 8, end: 20 },
      'photography': { start: 9, end: 18 },
      'outside-recording': { start: 6, end: 22 }  // More flexible for events
    };

    const hours = operatingHours[service_type] || { start: 8, end: 20 };

    for (let hour = hours.start; hour <= hours.end - slotDuration; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + slotDuration, 0, 0, 0);

      // Check if slot conflicts with existing bookings
      let isAvailable = true;
      for (const booking of bookings.rows) {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        // Check for overlap
        if ((slotStart < bookingEnd && slotEnd > bookingStart)) {
          isAvailable = false;
          break;
        }
      }

      // Check if slot is in the past
      if (slotStart < new Date()) {
        isAvailable = false;
      }

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        display: `${hour.toString().padStart(2, '0')}:00 - ${(hour + slotDuration).toString().padStart(2, '0')}:00`,
        available: isAvailable
      });
    }

    res.json({ 
      date: date,
      service_type: service_type,
      duration: slotDuration,
      slots: slots,
      available_count: slots.filter(s => s.available).length
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Error fetching available slots' });
  }
};

// Get service packages for a studio
exports.getServicePackages = async (req, res) => {
  try {
    const { service_type } = req.params;
    
    // Map service type to studio type
    const studioTypeMap = {
      'recording': 'recording',
      'photography': 'photography',
      'outside-recording': 'outside'
    };
    
    const studioType = studioTypeMap[service_type];
    if (!studioType) {
      return res.status(400).json({ message: 'Invalid service type' });
    }
    
    // Get packages for the studio
    const packages = await pool.query(`
      SELECT 
        sp.*,
        s.name as studio_name,
        s.type as studio_type
      FROM service_packages sp
      JOIN studios s ON sp.studio_id = s.id
      WHERE s.type = $1 AND sp.is_active = true
      ORDER BY sp.sort_order
    `, [studioType]);
    
    res.json({
      service_type,
      packages: packages.rows
    });
    
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Error fetching service packages' });
  }
};


// Delete booking - admin only
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Only admin can delete bookings
    if (!user.roles || !user.roles.includes('admin')) {
      return res.status(403).json({ 
        message: 'Access denied. Only administrators can delete bookings.' 
      });
    }
    
    // Check if booking exists
    const checkResult = await pool.query(
      'SELECT id FROM bookings WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Delete the booking
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Failed to delete booking' });
  }
};

