import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Chip, Grid, MenuItem, Alert, Snackbar
} from '@mui/material';
import { Edit, Delete, Add, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import api from '../services/api';

function ServicePackageManager() {
  const [activeTab, setActiveTab] = useState(0);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    package_name: '',
    description: '',
    price: '',
    duration: '',
    max_output: '',
    features: [],
    is_active: true
  });

  const serviceTypes = [
    { value: 'photography', label: 'Photography', studio_id: 6 },
    { value: 'recording', label: 'Recording Studio', studio_id: 5 },
    { value: 'outside-recording', label: 'Outside Recording', studio_id: 7 }
  ];

  useEffect(() => {
    loadPackages();
  }, [activeTab]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const serviceType = serviceTypes[activeTab].value;
      const response = await api.get(`/bookings/packages/${serviceType}`);
      setPackages(response.data.packages);
    } catch (error) {
      setAlert({
        open: true,
        message: 'Failed to load packages',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      max_output: pkg.max_output || '',
      features: pkg.features || [],
      is_active: pkg.is_active
    });
    setEditDialog(true);
  };

  const handleCreate = () => {
    setSelectedPackage(null);
    setFormData({
      package_name: '',
      description: '',
      price: '',
      duration: '',
      max_output: '',
      features: [],
      is_active: true
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        studio_id: serviceTypes[activeTab].studio_id,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        max_output: formData.max_output ? parseInt(formData.max_output) : null
      };

      if (selectedPackage) {
        // Update existing
        await api.put(`/service-packages/${selectedPackage.id}`, payload);
        setAlert({
          open: true,
          message: 'Package updated successfully',
          severity: 'success'
        });
      } else {
        // Create new
        await api.post('/service-packages', payload);
        setAlert({
          open: true,
          message: 'Package created successfully',
          severity: 'success'
        });
      }

      setEditDialog(false);
      loadPackages();
    } catch (error) {
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Failed to save package',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/service-packages/${selectedPackage.id}`);
      setAlert({
        open: true,
        message: 'Package deleted successfully',
        severity: 'success'
      });
      setDeleteDialog(false);
      loadPackages();
    } catch (error) {
      setAlert({
        open: true,
        message: 'Failed to delete package',
        severity: 'error'
      });
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateSortOrder = async (pkg, direction) => {
    try {
      await api.put(`/service-packages/${pkg.id}/sort`, { direction });
      loadPackages();
    } catch (error) {
      setAlert({
        open: true,
        message: 'Failed to update order',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Service Package Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
        >
          Add New Package
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        {serviceTypes.map((service, index) => (
          <Tab key={index} label={service.label} />
        ))}
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Package Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((pkg, index) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateSortOrder(pkg, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => updateSortOrder(pkg, 'down')}
                      disabled={index === packages.length - 1}
                    >
                      <ArrowDownward />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>{pkg.package_name}</TableCell>
                <TableCell>{pkg.description}</TableCell>
                <TableCell>₦{Number(pkg.price).toLocaleString()}</TableCell>
                <TableCell>{pkg.duration} hrs</TableCell>
                <TableCell>
                  <Chip
                    label={pkg.is_active ? 'Active' : 'Inactive'}
                    color={pkg.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(pkg)}>
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setDeleteDialog(true);
                    }}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPackage ? 'Edit Package' : 'Create New Package'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Package Name"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price (₦)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Output (optional)"
                type="number"
                value={formData.max_output}
                onChange={(e) => setFormData({ ...formData, max_output: e.target.value })}
                helperText="e.g., number of photos, songs"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Features
              </Typography>
              {formData.features.map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Enter feature"
                  />
                  <IconButton onClick={() => removeFeature(index)} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={addFeature} startIcon={<Add />}>
                Add Feature
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Package</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedPackage?.package_name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ServicePackageManager;
