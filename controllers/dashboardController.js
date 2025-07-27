const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const { user } = req;
    const isAdmin = user.roles?.includes('admin');
    const isMadmin = user.roles?.includes('madmin');
    const isEngineer = user.roles?.includes('engineer');
    const isStaff = user.roles?.includes('staff');
    const isClient = user.roles?.includes('client');
    
    let stats = {};
    
    // Admin sees everything
    if (isAdmin) {
      // Get total users
      const usersResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE status = 'active'"
      );
      stats.totalUsers = parseInt(usersResult.rows[0].count);
      
      // Get all active projects
      const projectsResult = await pool.query(
        "SELECT COUNT(*) as count FROM projects WHERE status = 'active'"
      );
      stats.activeProjects = parseInt(projectsResult.rows[0].count);
      
      // Get all clients
      const clientsResult = await pool.query(
        "SELECT COUNT(*) as count FROM clients WHERE is_active = true"
      );
      stats.totalClients = parseInt(clientsResult.rows[0].count);
      
      // Get all bookings
      const bookingsResult = await pool.query(
        "SELECT COUNT(*) as count FROM bookings WHERE status != 'cancelled'"
      );
      stats.totalBookings = parseInt(bookingsResult.rows[0].count);
      
      // Get total revenue
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM invoices 
         WHERE status = 'paid' 
         AND created_at >= date_trunc('month', CURRENT_DATE)`
      );
      stats.revenue = parseFloat(revenueResult.rows[0].total);
      
      // Pending actions for admin
      const pendingUsersResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE status = 'pending'"
      );
      const pendingInvoicesResult = await pool.query(
        "SELECT COUNT(*) as count FROM invoices WHERE status = 'pending'"
      );
      stats.pendingActions = parseInt(pendingUsersResult.rows[0].count) + 
                            parseInt(pendingInvoicesResult.rows[0].count);
      
    } else if (isMadmin && user.department_ids?.length > 0) {
      // Madmin sees only their department's data
      
      // Users in their departments
      const usersResult = await pool.query(
        `SELECT COUNT(DISTINCT u.id) as count 
         FROM users u
         JOIN user_departments ud ON u.id = ud.user_id
         WHERE u.status = 'active' 
         AND ud.department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.departmentUsers = parseInt(usersResult.rows[0].count);
      
      // Projects in their departments
      const projectsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM projects p
         JOIN clients c ON p.client_id = c.id
         WHERE p.status = 'active' 
         AND c.department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.departmentProjects = parseInt(projectsResult.rows[0].count);
      
      // Clients in their departments
      const clientsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM clients 
         WHERE is_active = true 
         AND department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.departmentClients = parseInt(clientsResult.rows[0].count);
      
      // Bookings in their departments
      const bookingsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM bookings 
         WHERE status != 'cancelled' 
         AND department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.departmentBookings = parseInt(bookingsResult.rows[0].count);
      
      // Department revenue
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(i.total_amount), 0) as total 
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE i.status = 'paid' 
         AND c.department_id = ANY($1)
         AND i.created_at >= date_trunc('month', CURRENT_DATE)`,
        [user.department_ids]
      );
      stats.departmentRevenue = parseFloat(revenueResult.rows[0].total);
      
    } else if (isEngineer && user.department_ids?.length > 0) {
      // Engineer sees their assigned bookings and projects
      
      // Bookings assigned to them
      const bookingsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM bookings 
         WHERE status = 'confirmed' 
         AND department_id = ANY($1)
         AND date >= CURRENT_DATE`,
        [user.department_ids]
      );
      stats.myBookings = parseInt(bookingsResult.rows[0].count);
      
      // Projects they're working on
      const projectsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM projects p
         JOIN clients c ON p.client_id = c.id
         WHERE p.status = 'active' 
         AND c.department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.activeProjects = parseInt(projectsResult.rows[0].count);
      
      // Today's schedule
      const todayResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM bookings 
         WHERE date = CURRENT_DATE 
         AND status = 'confirmed'
         AND department_id = ANY($1)`,
        [user.department_ids]
      );
      stats.todaySchedule = parseInt(todayResult.rows[0].count);
      
    } else if (isClient) {
      // Client sees only their own data
      
      // Their projects
      const projectsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM projects 
         WHERE client_id = $1 
         AND status != 'cancelled'`,
        [user.client_id]
      );
      stats.myProjects = parseInt(projectsResult.rows[0].count);
      
      // Their bookings
      const bookingsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM bookings 
         WHERE client_id = $1 
         AND status != 'cancelled'`,
        [user.client_id]
      );
      stats.myBookings = parseInt(bookingsResult.rows[0].count);
      
      // Their invoices
      const invoicesResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount END), 0) as amount_due
         FROM invoices 
         WHERE client_id = $1`,
        [user.client_id]
      );
      stats.invoices = {
        total: parseInt(invoicesResult.rows[0].total),
        paid: parseInt(invoicesResult.rows[0].paid),
        pending: parseInt(invoicesResult.rows[0].pending),
        amountDue: parseFloat(invoicesResult.rows[0].amount_due)
      };
    }
    
    // Get recent activities based on role
    stats.recentActivities = await getRecentActivities(user);
    
    // Add user role info to response
    stats.userRole = user.roles?.[0] || 'staff';
    stats.departments = user.department_ids || [];
    
    res.json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Helper function to get role-specific recent activities
async function getRecentActivities(user) {
  const activities = [];
  const isAdmin = user.roles?.includes('admin');
  const isMadmin = user.roles?.includes('madmin');
  const isClient = user.roles?.includes('client');
  
  try {
    if (isAdmin) {
      // Admin sees all activities
      const bookingsResult = await pool.query(
        `SELECT b.booking_number, s.name as studio_name, b.created_at, c.name as client_name
         FROM bookings b
         JOIN studios s ON b.studio_id = s.id
         LEFT JOIN clients c ON b.client_id = c.id
         ORDER BY b.created_at DESC
         LIMIT 5`
      );
      
      bookingsResult.rows.forEach(booking => {
        activities.push({
          type: 'booking',
          title: 'New booking created',
          description: `${booking.studio_name} - ${booking.client_name || 'Walk-in'}`,
          time: booking.created_at
        });
      });
      
    } else if (isMadmin && user.department_ids?.length > 0) {
      // Madmin sees department activities
      const bookingsResult = await pool.query(
        `SELECT b.booking_number, s.name as studio_name, b.created_at, c.name as client_name
         FROM bookings b
         JOIN studios s ON b.studio_id = s.id
         LEFT JOIN clients c ON b.client_id = c.id
         WHERE b.department_id = ANY($1)
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [user.department_ids]
      );
      
      bookingsResult.rows.forEach(booking => {
        activities.push({
          type: 'booking',
          title: 'Department booking',
          description: `${booking.studio_name} - ${booking.client_name || 'Walk-in'}`,
          time: booking.created_at
        });
      });
      
    } else if (isClient && user.client_id) {
      // Client sees their own activities
      const bookingsResult = await pool.query(
        `SELECT b.booking_number, s.name as studio_name, b.created_at, b.date
         FROM bookings b
         JOIN studios s ON b.studio_id = s.id
         WHERE b.client_id = $1
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [user.client_id]
      );
      
      bookingsResult.rows.forEach(booking => {
        activities.push({
          type: 'booking',
          title: 'Your booking',
          description: `${booking.studio_name} - ${booking.booking_number}`,
          time: booking.created_at
        });
      });
    }
    
    return activities;
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

exports.getQuickStats = async (req, res) => {
  // Similar role-based implementation for quick stats
  // ... implement based on user role
};
