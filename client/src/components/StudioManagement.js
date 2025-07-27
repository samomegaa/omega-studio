import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Card, CardContent,
  Typography, Box, Chip, IconButton, Switch,
  FormControlLabel, Divider, List, ListItem,
  ListItemText, ListItemSecondaryAction, Tab, Tabs,
  Select, MenuItem, FormControl, InputLabel,
  InputAdornment
} from '@mui/material';
import {
  Edit, Delete, Add, Save, Cancel,
  AttachMoney, AccessTime, Today
} from '@mui/icons-material';
import api from '../services/api';

function StudioManagement({ open, onClose, studios, fetchStudios }) {
  const [tabValue, setTabValue] = useState(0);
  const [editingStudio, setEditingStudio] = useState(null);
  const [studioForm, setStudioForm] = useState({
    name: '',
    type: '',
    description: '',
    capacity: 1,
    pricing_type: 'hourly',
    pricing_structure: {
      hourly: '',
      half_day: '',
      full_day: '',
      custom_rates: []
    },
    features: [],
    promo_active: false,
    promo_text: '',
    promo_rate: ''
  });
  const [newFeature, setNewFeature] = useState('');
  const [newCustomRate, setNewCustomRate] = useState({ name: '', rate: '' });

  const pricingTypes = [
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'session', label: 'Per Session' },
    { value: 'package', label: 'Package Based' },
    { value: 'custom', label: 'Custom Pricing' }
  ];

const handleEditStudio = (studio) => {
  setEditingStudio(studio);
  
  // Safely parse pricing_structure if it's a string
  let pricingStructure = {
    hourly: studio.hourly_rate || '',
    half_day: '',
    full_day: '',
    custom_rates: []
  };
  
  if (studio.pricing_structure) {
    if (typeof studio.pricing_structure === 'string') {
      try {
        pricingStructure = JSON.parse(studio.pricing_structure);
      } catch (e) {
        console.error('Error parsing pricing_structure:', e);
      }
    } else if (typeof studio.pricing_structure === 'object') {
      pricingStructure = {
        ...pricingStructure,
        ...studio.pricing_structure,
        custom_rates: Array.isArray(studio.pricing_structure.custom_rates) 
          ? studio.pricing_structure.custom_rates 
          : []
      };
    }
  }
  
  // Safely parse features if it's a string
  let features = [];
  if (studio.features) {
    if (typeof studio.features === 'string') {
      try {
        features = JSON.parse(studio.features);
      } catch (e) {
        console.error('Error parsing features:', e);
      }
    } else if (Array.isArray(studio.features)) {
      features = studio.features;
    }
  }
  
  setStudioForm({
    name: studio.name || '',
    type: studio.type || '',
    description: studio.description || '',
    capacity: studio.capacity || 1,
    pricing_type: studio.pricing_type || 'hourly',
    pricing_structure: pricingStructure,
    features: features,
    promo_active: studio.promo_active || false,
    promo_text: studio.promo_text || '',
    promo_rate: studio.promo_rate || ''
  });
  setTabValue(1);
};

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setStudioForm({
        ...studioForm,
        features: [...studioForm.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setStudioForm({
      ...studioForm,
      features: studioForm.features.filter((_, i) => i !== index)
    });
  };

  const handleAddCustomRate = () => {
    if (newCustomRate.name && newCustomRate.rate) {
      setStudioForm({
        ...studioForm,
        pricing_structure: {
          ...studioForm.pricing_structure,
          custom_rates: [
            ...studioForm.pricing_structure.custom_rates,
            newCustomRate
          ]
        }
      });
      setNewCustomRate({ name: '', rate: '' });
    }
  };

  const handleRemoveCustomRate = (index) => {
    setStudioForm({
      ...studioForm,
      pricing_structure: {
        ...studioForm.pricing_structure,
        custom_rates: studioForm.pricing_structure.custom_rates.filter((_, i) => i !== index)
      }
    });
  };

  const handleUpdateStudio = async () => {
    try {
      // Prepare the data
      const updateData = {
        ...studioForm,
        hourly_rate: studioForm.pricing_structure.hourly || 0
      };

      await api.put(`/studios/${editingStudio.id}`, updateData);
      
      // Show success message
      alert('Studio updated successfully!');
      
      // Reset form and refresh
      setEditingStudio(null);
      setTabValue(0);
      fetchStudios();
    } catch (error) {
      console.error('Error updating studio:', error);
      alert('Failed to update studio');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Studio Management
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Edit Studio" disabled={!editingStudio} />
        </Tabs>
      </Box>

      <DialogContent>
        {tabValue === 0 && (
          <Grid container spacing={2}>
            

{/* In the Overview tab section */}
{studios && studios.map(studio => (
  <Grid item xs={12} md={6} key={studio.id}>
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{studio.name}</Typography>
          <IconButton onClick={() => handleEditStudio(studio)}>
            <Edit />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {studio.description}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="subtitle2">Current Pricing:</Typography>
          {studio.hourly_rate && (
            <Chip 
              label={`Hourly: ₦${Number(studio.hourly_rate).toLocaleString()}`}
              size="small"
              sx={{ m: 0.5 }}
            />
          )}
          {studio.pricing_structure && 
           studio.pricing_structure.custom_rates && 
           Array.isArray(studio.pricing_structure.custom_rates) && 
           studio.pricing_structure.custom_rates.map((rate, idx) => (
            <Chip 
              key={idx}
              label={`${rate.name}: ₦${Number(rate.rate).toLocaleString()}`}
              size="small"
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>
        
        {studio.promo_active && (
          <Box mt={1}>
            <Chip 
              label={`PROMO: ${studio.promo_text || 'Active'}`}
              color="success"
              size="small"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  </Grid>
))}

          </Grid>
        )}

        {tabValue === 1 && editingStudio && (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Studio Name"
                    value={studioForm.name}
                    onChange={(e) => setStudioForm({...studioForm, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Capacity"
                    type="number"
                    value={studioForm.capacity}
                    onChange={(e) => setStudioForm({...studioForm, capacity: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={studioForm.description}
                    onChange={(e) => setStudioForm({...studioForm, description: e.target.value})}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Pricing Structure */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Pricing Structure</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Pricing Type</InputLabel>
                <Select
                  value={studioForm.pricing_type}
                  onChange={(e) => setStudioForm({...studioForm, pricing_type: e.target.value})}
                  label="Pricing Type"
                >
                  {pricingTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hourly Rate"
                    type="number"
                    value={studioForm.pricing_structure.hourly}
                    onChange={(e) => setStudioForm({
                      ...studioForm,
                      pricing_structure: {
                        ...studioForm.pricing_structure,
                        hourly: e.target.value
                      }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₦</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Half Day Rate"
                    type="number"
                    value={studioForm.pricing_structure.half_day}
                    onChange={(e) => setStudioForm({
                      ...studioForm,
                      pricing_structure: {
                        ...studioForm.pricing_structure,
                        half_day: e.target.value
                      }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₦</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Full Day Rate"
                    type="number"
                    value={studioForm.pricing_structure.full_day}
                    onChange={(e) => setStudioForm({
                      ...studioForm,
                      pricing_structure: {
                        ...studioForm.pricing_structure,
                        full_day: e.target.value
                      }
                    })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₦</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>

              {/* Custom Rates */}
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>Custom Rates</Typography>
                <List>
                  {studioForm.pricing_structure.custom_rates.map((rate, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={rate.name}
                        secondary={`₦${Number(rate.rate).toLocaleString()}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleRemoveCustomRate(index)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Box display="flex" gap={1} mt={1}>
                  <TextField
                    label="Rate Name"
                    value={newCustomRate.name}
                    onChange={(e) => setNewCustomRate({...newCustomRate, name: e.target.value})}
                    placeholder="e.g., Weekend Rate"
                  />
                  <TextField
                    label="Amount"
                    type="number"
                    value={newCustomRate.rate}
                    onChange={(e) => setNewCustomRate({...newCustomRate, rate: e.target.value})}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₦</InputAdornment>
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleAddCustomRate}
                    startIcon={<Add />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Promotional Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Promotional Settings</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={studioForm.promo_active}
                    onChange={(e) => setStudioForm({...studioForm, promo_active: e.target.checked})}
                  />
                }
                label="Enable Promotional Pricing"
              />
              
              {studioForm.promo_active && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Promo Text"
                      value={studioForm.promo_text}
                      onChange={(e) => setStudioForm({...studioForm, promo_text: e.target.value})}
                      placeholder="e.g., Holiday Special, 20% Off"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Promo Rate"
                      type="number"
                      value={studioForm.promo_rate}
                      onChange={(e) => setStudioForm({...studioForm, promo_rate: e.target.value})}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₦</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Features */}
            <Grid item xs={12}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Features & Amenities</Typography>
              
              <List>
                {studioForm.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={feature} />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleRemoveFeature(index)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box display="flex" gap={1} mt={1}>
                <TextField
                  fullWidth
                  label="Add Feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., Air Conditioning, Sound Proofing"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddFeature}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        {tabValue === 1 ? (
          <>
            <Button onClick={() => { setEditingStudio(null); setTabValue(0); }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateStudio}
              startIcon={<Save />}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default StudioManagement;
