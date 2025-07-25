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
  Card,
  CardContent,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  Person,
  CalendarToday,
  AttachMoney,
  Search,
  Refresh,
  Engineering,
  Business,
  Description,
  DateRange
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    department_id: '',
    assigned_to_id: '',
    status: 'active',
    start_date: '',
    end_date: ''
  });

// Add these new state variables
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const projectStatuses = [
    { value: 'active', label: 'Active', color: 'primary' },
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'on_hold', label: 'On Hold', color: 'error' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'default' }
  ];

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchDepartments();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  


const fetchDepartments = async () => {
  try {
    let endpoint = '/users/departments';
    
    // For madmin/engineer, get only their departments
    if (user?.role === 'madmin' || user?.role === 'engineer') {
      endpoint = `/users/${user.id}/departments`;
    }
    
    const response = await api.get(endpoint);
    setDepartments(response.data);
  } catch (error) {
    console.error('Error fetching departments:', error);
  }
};

const fetchEngineers = async (departmentId) => {
  try {
    const response = await api.get(`/projects/engineers?departmentId=${departmentId}`);
    setEngineers(response.data);
  } catch (error) {
    console.error('Error fetching engineers:', error);
    setEngineers([]);
  }
};


  
const handleOpenDialog = (project = null) => {
  if (project) {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      client_id: project.client_id || '',
      department_id: project.department_id,
      assigned_to_id: project.assigned_to_id || '',
      status: project.status,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : ''
    });
    if (project.department_id) {
      fetchEngineers(project.department_id);
    }
  } else {
    setEditingProject(null);
    
    // For madmin/engineer, pre-select their department
    let defaultDeptId = '';
    if ((user?.role === 'madmin' || user?.role === 'engineer') && departments.length > 0) {
      defaultDeptId = departments[0].id;
      fetchEngineers(defaultDeptId);
    }
    
    setFormData({
      title: '',
      description: '',
      client_id: '',
      department_id: defaultDeptId,
      assigned_to_id: '',
      status: 'active',
      start_date: '',
      end_date: ''
    });
  }
  setOpenDialog(true);
};

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setEngineers([]);
  };

  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setFormData({ 
      ...formData, 
      department_id: departmentId,
      assigned_to_id: '' // Reset engineer when department changes
    });
    if (departmentId) {
      fetchEngineers(departmentId);
    } else {
      setEngineers([]);
    }
  };


const handleSubmit = async () => {
  try {
    let projectData = { ...formData };
    
    // For madmin/engineer, auto-set department if not set
    if ((user?.role === 'madmin' || user?.role === 'engineer') && !projectData.department_id) {
      // Get user's first department from the departments list
      if (departments.length > 0) {
        projectData.department_id = departments[0].id;
      }
    }

    console.log('Submitting project data:', projectData); // Debug log

    if (!projectData.title || !projectData.start_date || !projectData.department_id) {
      setMessage({ type: 'error', text: 'Please fill in all required fields (Title, Department, Start Date)' });
      return;
    }

    if (editingProject) {
      await api.put(`/projects/${editingProject.id}`, projectData);
      setMessage({ type: 'success', text: 'Project updated successfully' });
    } else {
      await api.post('/projects', projectData);
      setMessage({ type: 'success', text: 'Project created successfully' });
    }
    handleCloseDialog();
    fetchProjects();
  } catch (error) {
    console.error('Project submission error:', error); // Debug log
    setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
  }
};



const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        setMessage({ type: 'success', text: 'Project deleted successfully' });
        fetchProjects();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete project' });
      }
    }
  };


const handleCreateClient = async () => {
  try {
    if (!newClientData.name || !newClientData.email) {
      setMessage({ type: 'error', text: 'Client name and email are required' });
      return;
    }

    // For madmin/engineer, use their first assigned department
    let departmentId = formData.department_id;
    if (!departmentId && (user?.role === 'madmin' || user?.role === 'engineer')) {
      if (departments.length > 0) {
        departmentId = departments[0].id;
      }
    }

    if (!departmentId) {
      setMessage({ type: 'error', text: 'Department is required' });
      return;
    }

    const clientResponse = await api.post('/clients', {
      ...newClientData,
      department_id: departmentId
    });

    // Refresh clients list
    await fetchClients();
    
    // Select the new client
    setFormData({ ...formData, client_id: clientResponse.data.client.id });
    
    // Reset form
    setShowNewClientForm(false);
    setNewClientData({ name: '', email: '', phone: '' });
    
    setMessage({ type: 'success', text: 'Client created successfully' });
  } catch (error) {
    console.error('Client creation error:', error);
    setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create client' });
  }
};

  const viewProjectDetails = async (project) => {
    try {
      const response = await api.get(`/projects/${project.id}`);
      setSelectedProject(response.data);
      setTabValue(0);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load project details' });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusChip = (status) => {
    const statusConfig = projectStatuses.find(s => s.value === status) || projectStatuses[0];
    return (
      <Chip
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
      />
    );
  };

  // Project details view
  if (selectedProject) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Project Details</Typography>
          <Button
            variant="outlined"
            onClick={() => setSelectedProject(null)}
          >
            Back to Projects
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Overview" />
                <Tab label="Timeline" />
                <Tab label="Team" />
                <Tab label="Files" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                      {selectedProject.title}
                    </Typography>
                    {getStatusChip(selectedProject.status)}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {selectedProject.description || 'No description provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Start Date
                        </Typography>
                        <Typography variant="h6">
                          {new Date(selectedProject.start_date).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          End Date
                        </Typography>
                        <Typography variant="h6">
                          {selectedProject.end_date 
                            ? new Date(selectedProject.end_date).toLocaleDateString()
                            : 'Not set'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="body1" color="textSecondary">
                  Project timeline and milestones will be displayed here...
                </Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="body1" color="textSecondary">
                  Team members and responsibilities...
                </Typography>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Typography variant="body1" color="textSecondary">
                  Project files and documents...
                </Typography>
              </TabPanel>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedProject.client_name || 'No client assigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProject.client_email}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Manager
                </Typography>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2 }}>
                    <Engineering />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedProject.engineer_full_name || selectedProject.engineer_name || 'Not assigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProject.engineer_email}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department
                </Typography>
                <Chip
                  label={selectedProject.department_name}
                  color="primary"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Main projects list view
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Project Management</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            New Project
          </Button>
          <IconButton onClick={fetchProjects} color="primary">
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
              placeholder="Search projects..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                {projectStatuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Total Projects: {filteredProjects.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <Assignment />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{project.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.description?.substring(0, 50)}
                          {project.description?.length > 50 && '...'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {project.client_name || 'No client'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.department_name}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }} />
                      <Typography variant="body2">
                        {project.engineer_name || 'Unassigned'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <DateRange fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {new Date(project.start_date).toLocaleDateString()}
                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(project.status)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => viewProjectDetails(project)}
                        color="info"
                      >
                        <Description />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(project)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(project.id)}
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
      )}

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              





<Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={formData.client_id}
                    label="Client"
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setShowNewClientForm(true);
                      } else {
                        setFormData({ ...formData, client_id: e.target.value });
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>No Client</em>
                    </MenuItem>
                    <MenuItem value="new" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      + Create New Client
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>


<Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department_id}
                    label="Department"
                    onChange={handleDepartmentChange}
                    disabled={user?.role === 'madmin' || user?.role === 'engineer'}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>


<Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    value={formData.assigned_to_id}
                    label="Assign To"
                    onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                    disabled={!formData.department_id || engineers.length === 0}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {engineers.map((engineer) => (
                      <MenuItem key={engineer.id} value={engineer.id}>
                        {engineer.full_name || engineer.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {projectStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          



{/* New Client Dialog */}
      <Dialog open={showNewClientForm} onClose={() => setShowNewClientForm(false)}>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowNewClientForm(false);
            setNewClientData({ name: '', email: '', phone: '' });
          }}>
            Cancel
          </Button>
          <Button onClick={handleCreateClient} variant="contained">
            Create Client
          </Button>
        </DialogActions>
      </Dialog>

</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
