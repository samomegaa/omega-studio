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
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  Business,
  Person,
  LocationOn,
  Search,
  Refresh,
  Assignment,
  AttachMoney,
  History,
  Notes
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    department_id: ''  // Add this 
 });

  // Mock data for now
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      try {
        const deptResponse = await api.get('/users/departments');
        setDepartments(deptResponse.data);
      } catch (err) {
        console.log('Using mock departments');
        setDepartments([
          { id: 1, name: 'Recording Studio' },
          { id: 2, name: 'Photo Studio' },
          { id: 3, name: 'Outside Recording' }
        ]);
      }
      
      // Try to fetch clients, fall back to mock data if API not ready
      try {
        const response = await api.get('/clients');
        setClients(response.data);
      } catch (err) {
        console.log('Using mock clients');
        const mockClients = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+234 123 456 7890',
            company: 'ABC Company Ltd',
            type: 'corporate',
            status: 'active',
            department_id: 1,
            department_name: 'Recording Studio',
            total_projects: 5,
            total_revenue: 2500000,
            created_at: '2024-01-15'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@email.com',
            phone: '+234 987 654 3210',
            company: '',
            type: 'individual',
            status: 'active',
            department_id: 2,
            department_name: 'Photo Studio',
            total_projects: 3,
            total_revenue: 750000,
            created_at: '2024-01-10'
          }
        ];
        setClients(mockClients);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
       department_id: client.department_id || ''  // Add this
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
       department_id: ''  // Add this
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleSubmit = async () => {
  try {
    if (!formData.department_id) {
      setMessage({ type: 'error', text: 'Please select a department' });
      return;
    }
    
    if (editingClient) {
      await api.put(`/clients/${editingClient.id}`, formData);
      setMessage({ type: 'success', text: 'Client updated successfully' });
    } else {
      await api.post('/clients', formData);
      setMessage({ type: 'success', text: 'Client created successfully' });
    }
    handleCloseDialog();
    fetchClients();
  } catch (error) {
    setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
  }
};

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This will not delete associated projects.')) {
      try {
        // await api.delete(`/clients/${clientId}`);
        setMessage({ type: 'success', text: 'Client deleted successfully' });
        fetchClients();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete client' });
      }
    }
  };

  const viewClientDetails = (client) => {
    setSelectedClient(client);
    setTabValue(0);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || client.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Client details view
  if (selectedClient) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Client Details</Typography>
          <Button
            variant="outlined"
            onClick={() => setSelectedClient(null)}
          >
            Back to Clients
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                    {selectedClient.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedClient.name}</Typography>
                    <Chip
                      label={selectedClient.type}
                      size="small"
                      color={selectedClient.type === 'corporate' ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Email /></ListItemIcon>
                    <ListItemText primary={selectedClient.email} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Phone /></ListItemIcon>
                    <ListItemText primary={selectedClient.phone || 'N/A'} />
                  </ListItem>
                  {selectedClient.company && (
                    <ListItem>
                      <ListItemIcon><Business /></ListItemIcon>
                      <ListItemText primary={selectedClient.company} />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon><LocationOn /></ListItemIcon>
                    <ListItemText primary={selectedClient.city || 'No address'} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Overview" />
                <Tab label="Projects" />
                <Tab label="Invoices" />
                <Tab label="Notes" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Projects
                        </Typography>
                        <Typography variant="h4">
                          {selectedClient.total_projects || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Revenue
                        </Typography>
                        <Typography variant="h4">
                          ₦{(selectedClient.total_revenue || 0).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Client Since
                        </Typography>
                        <Typography variant="h6">
                          {new Date(selectedClient.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="body1" color="textSecondary">
                  Projects list will be displayed here...
                </Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="body1" color="textSecondary">
                  Invoices list will be displayed here...
                </Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Typography variant="body1" color="textSecondary">
                  Client notes and communication history...
                </Typography>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Main clients list view
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Client Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            Add Client
          </Button>
          <IconButton onClick={fetchClients} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Client Type</InputLabel>
              <Select
                value={filterType}
                label="Client Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Total Clients: {filteredClients.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Clients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Contact</TableCell>
<TableCell>Department</TableCell>           
   <TableCell>Type</TableCell>
              <TableCell align="center">Projects</TableCell>
              <TableCell align="right">Total Revenue</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          





<TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {client.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{client.name}</Typography>
                      {client.company && (
                        <Typography variant="caption" color="text.secondary">
                          {client.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{client.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {client.phone || 'No phone'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={client.department_name || 'No Department'}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={client.type || 'individual'}
                    size="small"
                    color={client.type === 'corporate' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={client.total_projects || 0}
                    size="small"
                    icon={<Assignment />}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    ₦{(client.total_revenue || 0).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={client.is_active ? 'active' : 'inactive'}
                    size="small"
                    color={client.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => viewClientDetails(client)}
                      color="info"
                    >
                      <Person />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(client)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(client.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      {/* Add/Edit Client Dialog */}
   
{/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department_id}
                    label="Department"
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
 </Box>
  );
}

export default Clients;
