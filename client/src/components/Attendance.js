import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  IconButton,
  Avatar,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  AccessTime,
  ExitToApp,
  Coffee,
  EventNote,
  Check,
  Close,
  TrendingUp,
  People,
  DateRange,
  LocationOn,
  Notes,
  Settings,
  Refresh,
  Download,
  CheckCircle,
  Cancel,
  Schedule,
  EventBusy,
  Add,
  HelpOutline,
  MyLocation
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Attendance() {
  const { user } = useAuth();
  
  // ALL useState declarations go here, inside the function
  const [buttonLoading, setButtonLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openLocationHelp, setOpenLocationHelp] = useState(false);
  const [users, setUsers] = useState([]);  

  const [filters, setFilters] = useState({
    start_date: startOfMonth(new Date()).toISOString().split('T')[0],
    end_date: endOfMonth(new Date()).toISOString().split('T')[0],
    user_id: ''
  });
  
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

 // Helper function to format time
  const formatTime = (datetime) => {
    if (!datetime) return '-';
    try {
      const date = new Date(datetime);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch (error) {
      return '-';
    }
  };

const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) return "Chrome";
    if (userAgent.indexOf("Safari") > -1) return "Safari";
    if (userAgent.indexOf("Firefox") > -1) return "Firefox";
    if (userAgent.indexOf("Edge") > -1) return "Edge";
    return "your browser";
  };

const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', color: 'error' },
    { value: 'vacation', label: 'Vacation', color: 'primary' },
    { value: 'personal', label: 'Personal', color: 'secondary' },
    { value: 'emergency', label: 'Emergency', color: 'warning' }
  ];
  useEffect(() => {
    fetchTodayAttendance();
    fetchSettings();
    fetchAttendanceReport();
    fetchLeaveRequests();
    console.log('Today attendance:', todayAttendance);    

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
console.log('Today attendance response:', response.data); // Add this
 setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/attendance/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  
const fetchAttendanceReport = async () => {
  try {
    const response = await api.get('/attendance/report', { 
      params: filters 
    });
    setAttendanceReport(response.data.attendance || []);
    setStats(response.data.stats);
    
    // Add this line to set users (only admins will get users data)
    if (response.data.users) {
      setUsers(response.data.users);
    }
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    setMessage({ type: 'error', text: 'Failed to fetch attendance report' });
  }
};

const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/attendance/leaves');
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

const handleClockIn = async () => {
    try {
      setLoading(true);
      
      // Get location first - this will throw error if denied
      const location = await getCurrentLocation();
      
      const response = await api.post('/attendance/clock-in', { location });
      setTodayAttendance(response.data.attendance);
      setMessage({ type: 'success', text: response.data.message });
      fetchAttendanceReport();
    } catch (error) {
      if (error.message && error.message.includes('Location')) {
        // Location error
        setMessage({ 
          type: 'error', 
          text: error.message 
        });
      } else {
        // API error
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Failed to clock in' 
        });
      }
    } finally {
      setLoading(false);
    }
  };


const handleClockOut = async () => {
    try {
      setLoading(true);
      
      // Get location first - this will throw error if denied
      const location = await getCurrentLocation();
      
      const response = await api.post('/attendance/clock-out', { 
        location,
        notes: `Clocked out from: ${location}`
      });
      setTodayAttendance(response.data.attendance);
      setMessage({ type: 'success', text: response.data.message });
      fetchAttendanceReport();
    } catch (error) {
      if (error.message && error.message.includes('Location')) {
        // Location error
        setMessage({ 
          type: 'error', 
          text: error.message 
        });
      } else {
        // API error
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Failed to clock out' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

const handleBreakStart = async () => {
    try {
      const response = await api.post('/attendance/break-start');
      setTodayAttendance(response.data.attendance);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to start break' 
      });
    }
  };

  const handleBreakEnd = async () => {
    try {
      const response = await api.post('/attendance/break-end');
      setTodayAttendance(response.data.attendance);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to end break' 
      });
    }
  };

const getCurrentLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          let errorMessage = 'Location access is required for attendance';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions to clock in/out.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };








  const handleSubmitLeave = async () => {
    try {
      if (!leaveFormData.leave_type || !leaveFormData.start_date || !leaveFormData.end_date || !leaveFormData.reason) {
        setMessage({ type: 'error', text: 'Please fill all fields' });
        return;
      }
      
      await api.post('/attendance/leaves', leaveFormData);
      setMessage({ type: 'success', text: 'Leave request submitted successfully' });
      setOpenLeaveDialog(false);
      setLeaveFormData({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
      fetchLeaveRequests();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit leave request' 
      });
    }
  };

  const handleUpdateLeaveStatus = async (leaveId, status, comments = '') => {
    try {
      await api.put(`/attendance/leaves/${leaveId}`, { status, comments });
      setMessage({ type: 'success', text: `Leave request ${status}` });
      fetchLeaveRequests();
      setSelectedLeave(null);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update leave request' 
      });
    }
  };

const handleUpdateSettings = async () => {
  try {
 const settingsData = {
      office_start_time: settings.office_start_time,
      office_end_time: settings.office_end_time,
      late_mark_after: settings.late_mark_after,        // NOT late_mark_after_minutes
      half_day_after: settings.half_day_after           // NOT half_day_after_minutes
    };   
 await api.put('/attendance/settings', settings);
    setMessage({ type: 'success', text: 'Settings updated successfully' });
  } catch (error) {
    setMessage({ type: 'error', text: 'Error updating settings' });
  }
};

  const calculateWorkingHours = (attendance) => {
    if (!attendance?.clock_in || !attendance?.clock_out) {
      return 'N/A';
    }
    
    const clockIn = new Date(attendance.clock_in);
    const clockOut = new Date(attendance.clock_out);
    let totalMinutes = differenceInMinutes(clockOut, clockIn);
    
    // Subtract break time
    if (attendance.break_start_time && attendance.break_end_time) {
      const breakStart = new Date(attendance.break_start_time);
      const breakEnd = new Date(attendance.break_end_time);
      totalMinutes -= differenceInMinutes(breakEnd, breakStart);
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };







  const getStatusChip = (status) => {
    const statusConfig = {
      present: { color: 'success', label: 'Present' },
      late: { color: 'warning', label: 'Late' },
      absent: { color: 'error', label: 'Absent' },
      leave: { color: 'info', label: 'On Leave' },
      holiday: { color: 'default', label: 'Holiday' }
    };
    
    const config = statusConfig[status] || statusConfig.present;
    return <Chip size="small" label={config.label} color={config.color} />;
  };

  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';
  const isMadmin = user?.roles?.includes('madmin') || user?.role === 'madmin';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      


{/* Location Permission Help Dialog */}
      <Dialog open={openLocationHelp} onClose={() => setOpenLocationHelp(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <MyLocation sx={{ mr: 1 }} />
            How to Enable Location Permissions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Location access is required for security purposes to verify your physical presence when clocking in/out.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Chrome / Edge / Brave:
            </Typography>
            <List dense>
              <ListItem>1. Click the lock icon (🔒) in the address bar</ListItem>
              <ListItem>2. Find "Location" in the permissions list</ListItem>
              <ListItem>3. Change it from "Block" to "Allow"</ListItem>
              <ListItem>4. Refresh the page</ListItem>
            </List>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Firefox:
            </Typography>
            <List dense>
              <ListItem>1. Click the lock icon (🔒) in the address bar</ListItem>
              <ListItem>2. Click "More Information"</ListItem>
              <ListItem>3. Go to "Permissions" tab</ListItem>
              <ListItem>4. Find "Access Your Location" and uncheck "Use Default"</ListItem>
              <ListItem>5. Select "Allow"</ListItem>
              <ListItem>6. Refresh the page</ListItem>
            </List>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Safari:
            </Typography>
            <List dense>
              <ListItem>1. Go to Safari → Preferences</ListItem>
              <ListItem>2. Click "Websites" tab</ListItem>
              <ListItem>3. Select "Location" from the left sidebar</ListItem>
              <ListItem>4. Find "omegastudioakure.com" and change to "Allow"</ListItem>
              <ListItem>5. Refresh the page</ListItem>
            </List>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Mobile Devices:
            </Typography>
            <List dense>
              <ListItem><strong>iPhone:</strong> Settings → Privacy → Location Services → Safari → Allow</ListItem>
              <ListItem><strong>Android:</strong> Settings → Apps → Chrome → Permissions → Location → Allow</ListItem>
            </List>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              If you've allowed location but still see errors:
              <List dense>
                <ListItem>• Ensure your device's location services are turned on</ListItem>
                <ListItem>• Check if you're using a VPN that might block location</ListItem>
                <ListItem>• Try using a different browser</ListItem>
                <ListItem>• Clear your browser cache and cookies for this site</ListItem>
              </List>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationHelp(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>





</Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Attendance Management</Typography>
        <Box>
          <Typography variant="h6">
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(currentTime, 'EEEE, MMMM dd, yyyy')}
          </Typography>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Clock In/Out Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Attendance
              </Typography>
              
              {todayAttendance ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccessTime sx={{ mr: 1 }} />
                    <Typography>
                     Clock In: {todayAttendance.clock_in ? format(new Date(todayAttendance.clock_in), 'HH:mm:ss') : '-'}
                    </Typography>
                    {getStatusChip(todayAttendance.status)}
                  </Box>
                  
                  {todayAttendance.clock_out && (
                    <Box display="flex" alignItems="center" mb={2}>
                      <ExitToApp sx={{ mr: 1 }} />
                      <Typography>
                        Clock Out: {format(new Date(todayAttendance.clock_out), 'HH:mm:ss')}
                      </Typography>
                    </Box>
                  )}
                  
                  {todayAttendance.break_start_time && (
                    <Box display="flex" alignItems="center" mb={2}>
                      <Coffee sx={{ mr: 1 }} />
                      <Typography>
                        Break: {format(new Date(todayAttendance.break_start_time), 'HH:mm')}
                        {todayAttendance.break_end_time && 
                          ` - ${format(new Date(todayAttendance.break_end_time), 'HH:mm')}`
                        }
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ mr: 1 }} />
                    <Typography>
                      Working Hours: {calculateWorkingHours(todayAttendance)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Not clocked in yet
                </Typography>
              )}
            </CardContent>
             {message.type === 'error' && message.text.includes('Location') && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Button
                  size="small"
                  startIcon={<HelpOutline />}
                  onClick={() => setOpenLocationHelp(true)}
                  color="primary"
                >
                  How to enable location?
                </Button>
              </Box>
            )}
            <CardActions>
             {!todayAttendance || !todayAttendance.clock_in ? (
  <Button 
  variant="contained" 
  color="primary" 
  startIcon={<AccessTime />}
  onClick={handleClockIn}
  fullWidth
  disabled={buttonLoading}
>
  {buttonLoading ? 'Getting location...' : 'Clock In'}
</Button>

              ) : !todayAttendance.clock_out ? (
                <>
                  {!todayAttendance.break_start_time || todayAttendance.break_end_time ? (
                    <Button 
                      variant="outlined" 
                      startIcon={<Coffee />}
                      onClick={handleBreakStart}
                      sx={{ mr: 1 }}
                    >
                      Start Break
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      startIcon={<Coffee />}
                      onClick={handleBreakEnd}
                      sx={{ mr: 1 }}
                    >
                      End Break
                    </Button>
                  )}
<Button 
  variant="contained" 
  color="error" 
  startIcon={<ExitToApp />}
  onClick={handleClockOut}
  disabled={buttonLoading}
>
  {buttonLoading ? 'Getting location...' : 'Clock Out'}
</Button>




                </>
              ) : (
                <Typography color="text.secondary">
                  Attendance completed for today
                </Typography>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12} md={6}>
          <Card>

<Box display="flex" justifyContent="space-between" alignItems="center" p={2} pb={0}>
              <Typography variant="h6">
                Today's Attendance
              </Typography>
              <Tooltip title="Location Help">
                <IconButton size="small" onClick={() => setOpenLocationHelp(true)}>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>


            <CardContent>
              <Typography variant="h6" gutterBottom>
                This Month's Summary
              </Typography>
              {stats && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.present}</Typography>
                      <Typography variant="body2" color="text.secondary">Present</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Schedule color="warning" sx={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.late}</Typography>
                      <Typography variant="body2" color="text.secondary">Late</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Cancel color="error" sx={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.absent}</Typography>
                      <Typography variant="body2" color="text.secondary">Absent</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <EventBusy color="info" sx={{ fontSize: 40 }} />
                      <Typography variant="h4">{stats.leaves}</Typography>
                      <Typography variant="body2" color="text.secondary">Leaves</Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Attendance Report" icon={<EventNote />} />
          <Tab label="Leave Requests" icon={<EventBusy />} />
          {isAdmin && <Tab label="Settings" icon={<Settings />} />}
        </Tabs>

        
{/* Attendance Report Tab */}
<TabPanel value={tabValue} index={0}>
  <Box mb={2}>
    <Grid container spacing={2} alignItems="center">
      {/* User Filter - Add this for admin */}
      {isAdmin && (
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Employee</InputLabel>
            <Select
              value={filters.user_id || ''}
              onChange={(e) => setFilters({...filters, user_id: e.target.value})}
              label="Filter by Employee"
            >
              <MenuItem value="">All Employees</MenuItem>
              {users?.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name || user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      
      {/* Existing date filters */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          type="date"
          label="Start Date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  onClick={fetchAttendanceReport}
                  startIcon={<Refresh />}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  {(isAdmin || isMadmin) && <TableCell>Employee</TableCell>}
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Break</TableCell>
                  <TableCell>Working Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                
{attendanceReport.map((record, index) => (
  <TableRow key={`${record.id}-${index}`}>  {/* Changed this line */}
    {/* Rest of your code stays the same */}
    <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
    {(isAdmin || isMadmin) && (
      <TableCell>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
            {record.full_name?.charAt(0)}
          </Avatar>
          {record.full_name || record.username}
        </Box>
      </TableCell>
    )}
    <TableCell>
      {record.clock_in ? 
        format(new Date(record.clock_in), 'HH:mm:ss') : '-'}
    </TableCell>
    <TableCell>
      {record.clock_out ? 
        format(new Date(record.clock_out), 'HH:mm:ss') : '-'}
    </TableCell>
    {/* ... rest stays the same */}
  </TableRow>
))}

              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Leave Requests Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Leave Requests</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenLeaveDialog(true)}
            >
              Request Leave
            </Button>
          </Box>

          <List>
            {leaveRequests.map((leave) => (
              <React.Fragment key={leave.id}>
                <ListItem>
                  <ListItemIcon>
                    <EventBusy color={leave.status === 'approved' ? 'success' : 
                                      leave.status === 'rejected' ? 'error' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography>
                          {leave.full_name || leave.username} - 
                          {leaveTypes.find(t => t.value === leave.leave_type)?.label}
                        </Typography>
                        <Chip 
                          label={leave.status} 
                          size="small"
                          color={leave.status === 'approved' ? 'success' : 
                                leave.status === 'rejected' ? 'error' : 'warning'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(leave.start_date), 'MMM dd')} - 
                          {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reason: {leave.reason}
                        </Typography>
                        {leave.approved_by_name && (
                          <Typography variant="caption" color="text.secondary">
                            {leave.status} by {leave.approved_by_name}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {(isAdmin || isMadmin) && leave.status === 'pending' && (
                    <Box>
                      <Tooltip title="Approve">
                        <IconButton 
                          color="success" 
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          color="error"
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        
{/* Settings Tab (Admin Only) */}
{isAdmin && (
  <TabPanel value={tabValue} index={2}>
    <Box>
      <Typography variant="h6" gutterBottom>
        Attendance Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="time"
            label="Office Start Time"
            value={settings?.office_start_time || '09:00'}
            onChange={(e) => setSettings({...settings, office_start_time: e.target.value})}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="time"
            label="Office End Time"
            value={settings?.office_end_time || '18:00'}
            onChange={(e) => setSettings({...settings, office_end_time: e.target.value})}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Late Mark After (minutes)"
            value={settings?.late_mark_after_minutes || 15}
            onChange={(e) => setSettings({...settings, late_mark_after_minutes: parseInt(e.target.value)})}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Half Day After (minutes)"
            value={settings?.half_day_after_minutes || 240}
            onChange={(e) => setSettings({...settings, half_day_after_minutes: parseInt(e.target.value)})}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleUpdateSettings}
          >
            Save Settings
          </Button>
        </Grid>
      </Grid>
    </Box>
  </TabPanel>
)}
      </Paper>

      {/* Leave Request Dialog */}
      <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={leaveFormData.leave_type}
                    label="Leave Type"
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, leave_type: e.target.value })}
                  >
                    {leaveTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={leaveFormData.start_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={leaveFormData.end_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason"
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitLeave} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Attendance;
