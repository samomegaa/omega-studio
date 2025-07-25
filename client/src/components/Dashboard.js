import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar
} from '@mui/material';
import {
  People,
  Assignment,
  Person,
  CalendarToday,
  AttachMoney,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Today
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    clients: 0,
    bookings: 0,
    revenue: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data
      setStats({
        users: 5,
        projects: 12,
        clients: 8,
        bookings: 15,
        revenue: 2500000,
        pending: 3
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    if (user?.role === 'admin') {
      return [
        { title: 'Total Users', value: stats.users, icon: People, color: '#7c3aed', path: '/users' },
        { title: 'Active Projects', value: stats.projects, icon: Assignment, color: '#10b981', path: '/projects' },
        { title: 'Total Clients', value: stats.clients, icon: Person, color: '#f59e0b', path: '/clients' },
        { title: 'Bookings', value: stats.bookings, icon: CalendarToday, color: '#ef4444', path: '/bookings' },
        { title: 'Revenue (₦)', value: stats.revenue.toLocaleString(), icon: AttachMoney, color: '#3b82f6', path: '/invoices' },
        { title: 'Pending Actions', value: stats.pending, icon: AccessTime, color: '#f97316', path: '/users' }
      ];
    } else if (user?.role === 'madmin') {
      return [
        { title: 'Department Projects', value: stats.projects, icon: Assignment, color: '#10b981', path: '/projects' },
        { title: 'Department Clients', value: stats.clients, icon: Person, color: '#f59e0b', path: '/clients' },
        { title: 'Upcoming Bookings', value: stats.bookings, icon: CalendarToday, color: '#ef4444', path: '/bookings' },
        { title: 'Department Revenue (₦)', value: stats.revenue.toLocaleString(), icon: AttachMoney, color: '#3b82f6', path: '/invoices' }
      ];
    } else if (user?.role === 'engineer') {
      return [
        { title: 'My Projects', value: stats.projects, icon: Assignment, color: '#10b981', path: '/projects' },
        { title: 'My Clients', value: stats.clients, icon: Person, color: '#f59e0b', path: '/clients' },
        { title: 'Today\'s Bookings', value: 3, icon: CalendarToday, color: '#ef4444', path: '/bookings' }
      ];
    } else { // Staff role
      return [
        { title: 'My Attendance', value: 'Present', icon: CheckCircle, color: '#10b981', path: '/attendance' },
        { title: 'Today', value: new Date().toLocaleDateString(), icon: Today, color: '#7c3aed', path: '/attendance' }
      ];
    }
  };

  const statCards = getStatCards();

  // Check if user should see recent activities
  const shouldShowRecentActivities = user?.role !== 'staff';
  const shouldShowQuickActions = true; // All users can see quick actions relevant to their role

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.fullName || user?.username}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {user?.role === 'staff' 
          ? 'Track your attendance and view your work schedule.'
          : 'Here\'s what\'s happening at Omega Studio today.'}
      </Typography>

      {loading && <LinearProgress sx={{ mt: 2, mb: 2 }} />}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: card.color, width: 56, height: 56 }}>
                    <card.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Recent Activities - Hidden for staff */}
        {shouldShowRecentActivities && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="New booking created"
                    secondary="Recording Studio - 2 hours ago"
                  />
                  <Chip label="Booking" size="small" color="primary" />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Invoice #INV-2024-001 paid"
                    secondary="Client: ABC Company - 5 hours ago"
                  />
                  <Chip label="Payment" size="small" color="success" />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="New project started"
                    secondary="Photo Studio - Yesterday"
                  />
                  <Chip label="Project" size="small" color="warning" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={shouldShowRecentActivities ? 6 : 12}>
          <Paper sx={{ p: 3, height: shouldShowRecentActivities ? '400px' : 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {user?.role === 'admin' && (
                <>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<People />}
                      onClick={() => navigate('/users')}
                    >
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/projects')}
                    >
                      New Project
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Person />}
                      onClick={() => navigate('/clients')}
                    >
                      Add Client
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      startIcon={<CalendarToday />}
                      onClick={() => navigate('/bookings')}
                    >
                      New Booking
                    </Button>
                  </Grid>
                </>
              )}
              {user?.role === 'madmin' && (
                <>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/projects')}
                    >
                      New Project
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<CalendarToday />}
                      onClick={() => navigate('/bookings')}
                    >
                      View Bookings
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Person />}
                      onClick={() => navigate('/clients')}
                    >
                      Manage Clients
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      startIcon={<AttachMoney />}
                      onClick={() => navigate('/invoices')}
                    >
                      Invoices
                    </Button>
                  </Grid>
                </>
              )}
              {user?.role === 'engineer' && (
                <>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/projects')}
                    >
                      My Projects
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      startIcon={<CalendarToday />}
                      onClick={() => navigate('/bookings')}
                    >
                      View Bookings
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AccessTime />}
                      onClick={() => navigate('/attendance')}
                    >
                      My Attendance
                    </Button>
                  </Grid>
                </>
              )}
              {user?.role === 'staff' && (
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<AccessTime />}
                    onClick={() => navigate('/attendance')}
                  >
                    View My Attendance
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
