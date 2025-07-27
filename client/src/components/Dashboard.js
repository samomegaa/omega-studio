import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, 
  Chip, CircularProgress, Alert 
} from '@mui/material';
import {
  People, Assignment, Business, CalendarToday,
  AttachMoney, Warning, Schedule, Receipt
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const renderAdminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {stats.totalUsers}
                </Typography>
              </Box>
              <People color="primary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Active Projects
                </Typography>
                <Typography variant="h4">
                  {stats.activeProjects}
                </Typography>
              </Box>
              <Assignment color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Total Clients
                </Typography>
                <Typography variant="h4">
                  {stats.totalClients}
                </Typography>
              </Box>
              <Business color="info" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Bookings
                </Typography>
                <Typography variant="h4">
                  {stats.totalBookings}
                </Typography>
              </Box>
              <CalendarToday color="secondary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Revenue (Monthly)
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(stats.revenue)}
                </Typography>
              </Box>
              <AttachMoney color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {stats.pendingActions > 0 && (
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Actions
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingActions}
                  </Typography>
                </Box>
                <Warning color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderMadminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Department Staff
            </Typography>
            <Typography variant="h4">
              {stats.departmentUsers}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Department Projects
            </Typography>
            <Typography variant="h4">
              {stats.departmentProjects}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Department Clients
            </Typography>
            <Typography variant="h4">
              {stats.departmentClients}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Department Revenue
            </Typography>
            <Typography variant="h5">
              {formatCurrency(stats.departmentRevenue)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEngineerDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Today's Sessions
            </Typography>
            <Typography variant="h4">
              {stats.todaySchedule}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Upcoming Bookings
            </Typography>
            <Typography variant="h4">
              {stats.myBookings}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Projects
            </Typography>
            <Typography variant="h4">
              {stats.activeProjects}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderClientDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              My Projects
            </Typography>
            <Typography variant="h4">
              {stats.myProjects}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              My Bookings
            </Typography>
            <Typography variant="h4">
              {stats.myBookings}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Pending Invoices
            </Typography>
            <Typography variant="h4">
              {stats.invoices?.pending || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Amount Due
            </Typography>
            <Typography variant="h5">
              {formatCurrency(stats.invoices?.amountDue)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Alert severity="error">
        Failed to load dashboard statistics
      </Alert>
    );
  }

  const userRole = stats.userRole;
  const isAdmin = userRole === 'admin';
  const isMadmin = userRole === 'madmin';
  const isEngineer = userRole === 'engineer';
  const isClient = userRole === 'client';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.full_name || user?.username}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {isAdmin && "Here's what's happening at Omega Studio today."}
        {isMadmin && "Here's your department overview."}
        {isEngineer && "Here's your schedule and assignments."}
        {isClient && "Here's your account overview."}
      </Typography>

      <Box sx={{ mt: 3 }}>
        {isAdmin && renderAdminDashboard()}
        {isMadmin && renderMadminDashboard()}
        {isEngineer && renderEngineerDashboard()}
        {isClient && renderClientDashboard()}
      </Box>

      {/* Recent Activities */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            {stats.recentActivities.map((activity, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={activity.type} 
                      size="small" 
                      color={
                        activity.type === 'booking' ? 'primary' :
                        activity.type === 'payment' ? 'success' :
                        'default'
                      }
                    />
                    <Typography variant="body1">
                      {activity.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(activity.time)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
                  {activity.description}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Dashboard;
