import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Check,
  Close,
  PersonAdd,
  FilterList,
  Refresh,
  VpnKey
} from '@mui/icons-material';
import api from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({
  search: '',
    role: '',
    department: '',
    status: ''
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    roles: [],
    departments: [],
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles'),
        api.get('/users/departments')
      ]);
  

     console.log('Roles:', rolesRes.data);  // Add this
      console.log('Departments:', deptsRes.data);  // Add this
    
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        roles: user.role_ids || [],
        departments: user.department_ids || [],
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        roles: [],
        departments: [],
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
  try {
    if (editingUser) {
      await api.put(`/users/${editingUser.id}`, formData);
      setMessage({ type: 'success', text: 'User updated successfully' });
    } else {
      // Use the users endpoint for admin-created users
      await api.post('/users', formData);
      setMessage({ type: 'success', text: 'User created successfully' });
    }
    handleCloseDialog();
    fetchData();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
  }
};

  const handleApprove = async (userId) => {
    try {
      await api.put(`/users/${userId}/approve`);
      setMessage({ type: 'success', text: 'User approved successfully' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve user' });
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        setMessage({ type: 'success', text: 'User deleted successfully' });
        fetchData();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete user' });
      }
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${user.id}`, { ...user, status: newStatus });
      setMessage({ type: 'success', text: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };
const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      await api.put(`/users/${resetPasswordUser.id}/reset-password`, { password: newPassword });
      setMessage({ type: 'success', text: 'Password reset successfully' });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setResetPasswordUser(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    }
  };

  const openPasswordDialog = (user) => {
    setResetPasswordUser(user);
    setPasswordDialogOpen(true);
    setNewPassword('');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesRole = !filters.role || user.roles.includes(filters.role);
    const matchesDepartment = !filters.department || user.departments.includes(filters.department);
    const matchesStatus = !filters.status || user.status === filters.status;
    const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      await api.put(`/users/${resetPasswordUser.id}/reset-password`, { password: newPassword });
      setMessage({ type: 'success', text: 'Password reset successfully' });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setResetPasswordUser(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    }
  };

  const openPasswordDialog = (user) => {
    setResetPasswordUser(user);
    setPasswordDialogOpen(true);
    setNewPassword('');
  };
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            Add User
          </Button>
          <IconButton onClick={fetchData} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Roles</InputLabel>
                  <Select
                    multiple
                    value={formData.roles}
                    onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {selected.map((value) => (
                          <Chip key={value} label={roles.find(r => r.id === value)?.name || value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Checkbox checked={formData.roles.indexOf(role.id) > -1} />
                        <ListItemText primary={role.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Departments</InputLabel>
                  <Select
                    multiple
                    value={formData.departments}
                    onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                    input={<OutlinedInput label="Departments" />}
                    renderValue={(selected) => (
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {selected.map((value) => (
                          <Chip key={value} label={departments.find(d => d.id === value)?.name || value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        <Checkbox checked={formData.departments.indexOf(dept.id) > -1} />
                        <ListItemText primary={dept.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Departments</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{user.username}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      {user.full_name && (
                        <Typography variant="caption" color="text.secondary">
                          {user.full_name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {user.roles.map((role, index) => (
                      <Chip
                        key={index}
                        label={role}
                        size="small"
                        color={role === 'admin' ? 'error' : role === 'madmin' ? 'warning' : 'default'}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {user.departments.map((dept, index) => (
                      <Chip
                        key={index}
                        label={dept}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {user.status === 'pending' ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      startIcon={<Check />}
                      onClick={() => handleApprove(user.id)}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Switch
                      checked={user.status === 'active'}
                      onChange={() => handleStatusToggle(user)}
                      color="primary"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    color="primary"
                    title="Edit User"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => openPasswordDialog(user)}
                    color="secondary"
                    title="Reset Password"
                  >
                    <VpnKey />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(user.id)}
                    color="error"
                    title="Delete User"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              {!editingUser && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Roles</InputLabel>
                  <Select
                    multiple
                    value={formData.roles}
                    onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const role = roles.find(r => r.id === value);
                          return (
                            <Chip key={value} label={role ? role.name : value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        <Checkbox checked={formData.roles.indexOf(role.id) > -1} />
                        <ListItemText primary={role.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Departments</InputLabel>
                  <Select
                    multiple
                    value={formData.departments}
                    onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                    input={<OutlinedInput label="Departments" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const dept = departments.find(d => d.id === value);
                          return (
                            <Chip key={value} label={dept ? dept.name : value} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        <Checkbox checked={formData.departments.indexOf(dept.id) > -1} />
                        <ListItemText primary={dept.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => {
        setPasswordDialogOpen(false);
        setNewPassword('');
        setResetPasswordUser(null);
      }}>
        <DialogTitle>Reset Password for {resetPasswordUser?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 300 }}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Password must be at least 6 characters long"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPasswordDialogOpen(false);
            setNewPassword('');
            setResetPasswordUser(null);
          }}>Cancel</Button>
          <Button onClick={handlePasswordReset} variant="contained" color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;
