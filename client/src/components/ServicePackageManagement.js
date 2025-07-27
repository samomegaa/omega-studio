import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Card, CardContent,
  Typography, Box, Chip, IconButton, Switch,
  FormControlLabel, Divider, List, ListItem,
  ListItemText, ListItemSecondaryAction,
  Select, MenuItem, FormControl, InputLabel,
  InputAdornment, Tab, Tabs
} from '@mui/material';
import {
  Edit, Delete, Add, Save, Cancel,
  AttachMoney, CheckCircle, CameraAlt,
  Videocam, Mic, EditNote
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';  // ADD THIS IMPORT HERE

function ServicePackageManagement({ open, onClose, defaultServiceType }) {
const { user } = useAuth(); // Add this import at the top  
const [packages, setPackages] = useState([]);
  const [studios, setStudios] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [packageForm, setPackageForm] = useState({
    package_name: '',
    service_type: 'photography',
    description: '',
    price: '',
    starting_price: '',
    duration: '',
    max_output: '',
    features: [],
    studio_id: '',
    is_active: true,
    sort_order: 0
  });


const isAdmin = user?.roles?.includes('admin');
  const isMadmin = user?.roles?.includes('madmin');

  // Filter studios based on user's department access
  const getFilteredStudios = () => {
    if (isAdmin) {
      return studios; // Admin sees all studios
    }
    
    if (isMadmin && user.department_ids) {
      // Map department IDs to studio IDs
      // Department 1 = Recording Studio (ID 5)
      // Department 2 = Photo Studio (ID 6)
      // Department 3 = Outside Recording (ID 7)
      const departmentStudioMap = {
        1: 5,  // Recording Studio
        2: 6,  // Photo Studio
        3: 7   // Outside Recording
      };
      
      const allowedStudioIds = user.department_ids.map(deptId => departmentStudioMap[deptId]);
      return studios.filter(studio => allowedStudioIds.includes(studio.id));
    }
    
    return [];
  };

  // Filter packages based on user's accessible studios
// Filter packages based on user's accessible studios
  const getFilteredPackages = () => {
    if (isAdmin) {
      return packages; // Admin sees all packages
    }
    
    if (isMadmin) {
      const allowedStudios = getFilteredStudios();
      const allowedStudioIds = allowedStudios.map(s => s.id);
      
      // For packages tied to studios
      return packages.filter(pkg => {
        // If package has studio_id, check if it's allowed
        if (pkg.studio_id) {
          return allowedStudioIds.includes(pkg.studio_id);
        }
        
        // For service-type based filtering
        if (pkg.service_type && user.department_ids) {
          const serviceTypeDepartmentMap = {
            'photography': 2,    // Photo Studio department
            'recording': 1,      // Recording Studio department
            'videography': 3,    // Outside Recording department
            'outside': 3         // Outside Recording department
          };
          
          const requiredDeptId = serviceTypeDepartmentMap[pkg.service_type];
          return user.department_ids.includes(requiredDeptId);
        }
        
        return false;
      });
    }

return [];
  };  // This closing brace is missing for getFilteredPackages function

  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  const serviceTypes = [
    { value: 'photography', label: 'Photography', icon: <CameraAlt /> },
    { value: 'videography', label: 'Videography', icon: <Videocam /> },
    { value: 'recording', label: 'Recording', icon: <Mic /> },
    { value: 'editing', label: 'Editing', icon: <EditNote /> }
  ];

  useEffect(() => {
    if (open) {
      fetchPackages();
      fetchStudios();
    }
  }, [open]);
// ADD this new useEffect AFTER the first one
useEffect(() => {
  if (defaultServiceType && open) {
    const tabIndex = serviceTypes.findIndex(t => t.value === defaultServiceType);
    if (tabIndex >= 0) {
      setTabValue(tabIndex);
      setPackageForm(prev => ({
        ...prev,
        service_type: defaultServiceType
      }));
    }
  }
}, [defaultServiceType, open]);
  

const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/service-packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudios = async () => {
    try {
      const response = await api.get('/studios');
      setStudios(response.data);
    } catch (error) {
      console.error('Error fetching studios:', error);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setPackageForm({
        ...packageForm,
        features: [...packageForm.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setPackageForm({
      ...packageForm,
      features: packageForm.features.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    try {
      const dataToSend = {
        ...packageForm,
        price: packageForm.price || packageForm.starting_price || null,
        starting_price: packageForm.starting_price || packageForm.price || null,
        duration: packageForm.duration || null,
        max_output: packageForm.max_output || null,
        studio_id: packageForm.studio_id || null,
        sort_order: packageForm.sort_order || 0
      };

      if (editingPackage) {
        await api.put(`/service-packages/${editingPackage.id}`, dataToSend);
      } else {
        await api.post('/service-packages', dataToSend);
      }
      
      fetchPackages();
      resetForm();
      alert('Service package saved successfully!');
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service package?')) {
      try {
        await api.delete(`/service-packages/${id}`);
        fetchPackages();
      } catch (error) {
        alert('Failed to delete package');
      }
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      package_name: pkg.package_name || '',
      service_type: pkg.service_type || 'photography',
      description: pkg.description || '',
      price: pkg.price || '',
      starting_price: pkg.starting_price || pkg.price || '',
      duration: pkg.duration || '',
      max_output: pkg.max_output || '',
      features: pkg.features || [],
      studio_id: pkg.studio_id || '',
      is_active: pkg.is_active !== false,
      sort_order: pkg.sort_order || 0
    });
    
    // Switch to the tab of the service type
    const tabIndex = serviceTypes.findIndex(t => t.value === (pkg.service_type || 'photography'));
    setTabValue(tabIndex >= 0 ? tabIndex : 0);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setPackageForm({
      package_name: '',
      service_type: serviceTypes[tabValue].value,
      description: '',
      price: '',
      starting_price: '',
      duration: '',
      max_output: '',
      features: [],
      studio_id: '',
      is_active: true,
      sort_order: 0
    });
  };

  const handleTabChange = (event, newValue) => {

if (isMadmin && !isAdmin) {
    // Check if madmin has access to this service type
    const serviceType = serviceTypes[newValue].value;
    const serviceTypeDepartmentMap = {
      'photography': 2,
      'recording': 1,
      'videography': 3,
      'outside': 3
    };
    
    const requiredDeptId = serviceTypeDepartmentMap[serviceType];
    if (!user.department_ids?.includes(requiredDeptId)) {
      alert('You do not have access to manage this service type');
      return;
    }
  }

    setTabValue(newValue);
    setPackageForm({
      ...packageForm,
      service_type: serviceTypes[newValue].value
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Service Package Management
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          {serviceTypes.map((type, index) => (
            <Tab 
              key={type.value} 
              label={type.label} 
              icon={type.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </Typography>

            <TextField
              fullWidth
              label="Package Name"
              value={packageForm.package_name}
              onChange={(e) => setPackageForm({...packageForm, package_name: e.target.value})}
              margin="normal"
              required
              placeholder={`e.g., ${serviceTypes[tabValue].label} Package`}
            />

            <TextField
              fullWidth
              label="Description"
              value={packageForm.description}
              onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
              margin="normal"
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              label="Starting Price"
              type="number"
              value={packageForm.starting_price}
              onChange={(e) => setPackageForm({...packageForm, starting_price: e.target.value})}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">₦</InputAdornment>
              }}
              helperText="This will be shown as 'Starting from ₦X'"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Associated Studio (Optional)</InputLabel>
             



<Select
  value={packageForm.studio_id}
  onChange={(e) => setPackageForm({...packageForm, studio_id: e.target.value})}
  label="Associated Studio (Optional)"
>
  <MenuItem value="">
    <em>None</em>
  </MenuItem>
  {getFilteredStudios().map(studio => (  // Changed from studios.map
    <MenuItem key={studio.id} value={studio.id}>
      {studio.name}
    </MenuItem>
  ))}
</Select>

            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({...packageForm, duration: e.target.value})}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Deliverables"
                  type="number"
                  value={packageForm.max_output}
                  onChange={(e) => setPackageForm({...packageForm, max_output: e.target.value})}
                  margin="normal"
                  helperText="e.g., 20 photos"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={packageForm.sort_order}
              onChange={(e) => setPackageForm({...packageForm, sort_order: e.target.value})}
              margin="normal"
              helperText="Lower numbers appear first"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={packageForm.is_active}
                  onChange={(e) => setPackageForm({...packageForm, is_active: e.target.checked})}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>Features</Typography>
            <List dense>
              {packageForm.features.map((feature, index) => (
                <ListItem key={index}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                  <ListItemText primary={feature} />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => handleRemoveFeature(index)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Box display="flex" gap={1} mt={1}>
              <TextField
                fullWidth
                size="small"
                label="Add Feature"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                placeholder="e.g., Professional headshots"
              />
              <Button 
                variant="contained" 
                onClick={handleAddFeature}
                startIcon={<Add />}
              >
                Add
              </Button>
            </Box>

            <Box mt={3} display="flex" gap={1}>
              <Button 
                variant="contained" 
                onClick={handleSave}
                startIcon={<Save />}
                fullWidth
                disabled={!packageForm.package_name || !packageForm.starting_price}
              >
                {editingPackage ? 'Update' : 'Create'} Package
              </Button>
              {editingPackage && (
                <Button 
                  variant="outlined" 
                  onClick={resetForm}
                  fullWidth
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>

          {/* Package List Section */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>
              {serviceTypes[tabValue].label} Packages
            </Typography>
            
           

// In the package display section
{getFilteredPackages()  // Changed from packages
  .filter(pkg => pkg.service_type === serviceTypes[tabValue].value)
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(pkg => (


 <Card key={pkg.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Typography variant="h6">
                          {pkg.package_name}
                          {!pkg.is_active && (
                            <Chip label="Inactive" size="small" color="error" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Starting from ₦{Number(pkg.starting_price || pkg.price).toLocaleString()}
                        </Typography>
                        {pkg.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {pkg.description}
                          </Typography>
                        )}
                        <Box display="flex" gap={2} mb={1}>
                          {pkg.duration && (
                            <Chip 
                              label={`${pkg.duration} mins`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {pkg.max_output && (
                            <Chip 
                              label={`${pkg.max_output} deliverables`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {pkg.studio_id && studios.find(s => s.id === pkg.studio_id) && (
                            <Chip 
                              label={studios.find(s => s.id === pkg.studio_id).name} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {pkg.features && pkg.features.length > 0 && (
                          <Box>
                            {pkg.features.map((feature, idx) => (
                              <Box key={idx} display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                                <CheckCircle sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                                <Typography variant="body2">{feature}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleEdit(pkg)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(pkg.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            
            {packages.filter(pkg => pkg.service_type === serviceTypes[tabValue].value).length === 0 && !loading && (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No {serviceTypes[tabValue].label.toLowerCase()} packages yet.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first package using the form.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ServicePackageManagement;
