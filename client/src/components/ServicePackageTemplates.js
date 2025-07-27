import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Card, CardContent, CardActions,
  Typography, Box, Chip, IconButton,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  ContentCopy, CheckCircle, Edit, Delete,
  CameraAlt, Videocam, Mic, EditNote
} from '@mui/icons-material';
import api from '../services/api';

const packageTemplates = [
  {
    id: 'photo-basic',
    service_type: 'photography',
    package_name: 'Basic Photography Package',
    description: 'Perfect for individual portraits and small events',
    starting_price: 15000,
    duration: 60,
    max_output: 20,
    features: [
      'Professional photographer',
      'Basic editing included',
      'Digital delivery',
      'Online gallery for 30 days'
    ],
    icon: <CameraAlt />
  },
  {
    id: 'photo-premium',
    service_type: 'photography',
    package_name: 'Premium Photography Package',
    description: 'Comprehensive photography service for special occasions',
    starting_price: 50000,
    duration: 240,
    max_output: 100,
    features: [
      'Senior photographer',
      'Advanced editing and retouching',
      'Multiple locations',
      'Print-ready files',
      'Online gallery for 1 year',
      'USB delivery included'
    ],
    icon: <CameraAlt />
  },
  {
    id: 'record-basic',
    service_type: 'recording',
    package_name: 'Demo Recording Package',
    description: 'Great for demos and single tracks',
    starting_price: 10000,
    duration: 120,
    features: [
      'Professional recording equipment',
      'Sound engineer',
      'Basic mixing',
      'Digital delivery'
    ],
    icon: <Mic />
  },
  {
    id: 'record-album',
    service_type: 'recording',
    package_name: 'Full Album Production',
    description: 'Complete album recording and production',
    starting_price: 150000,
    duration: null,
    features: [
      'Unlimited studio time',
      'Professional producer',
      'Full mixing and mastering',
      'Guest musician coordination',
      'Album artwork consultation',
      'Distribution ready files'
    ],
    icon: <Mic />
  },
  {
    id: 'video-event',
    service_type: 'videography',
    package_name: 'Event Coverage Package',
    description: 'Professional event videography',
    starting_price: 75000,
    duration: 480,
    features: [
      'Multi-camera setup',
      'Professional videographers',
      'Same-day highlights',
      'Full event edit',
      '4K quality',
      'Drone footage (where permitted)'
    ],
    icon: <Videocam />
  },
  {
    id: 'video-corporate',
    service_type: 'videography',
    package_name: 'Corporate Video Package',
    description: 'Professional corporate video production',
    starting_price: 100000,
    features: [
      'Script consultation',
      'Professional crew',
      'Teleprompter available',
      'Motion graphics',
      'Multiple format delivery',
      'Revisions included'
    ],
    icon: <Videocam />
  }
];

function ServicePackageTemplates({ open, onClose, onSelectTemplate }) {
  const [selectedType, setSelectedType] = useState('all');

  const serviceTypes = [
    { value: 'all', label: 'All Templates' },
    { value: 'photography', label: 'Photography', icon: <CameraAlt /> },
    { value: 'recording', label: 'Recording', icon: <Mic /> },
    { value: 'videography', label: 'Videography', icon: <Videocam /> }
  ];

  const filteredTemplates = selectedType === 'all' 
    ? packageTemplates 
    : packageTemplates.filter(t => t.service_type === selectedType);

  const handleSelectTemplate = (template) => {
    onSelectTemplate({
      ...template,
      id: undefined, // Remove template ID
      is_active: true,
      sort_order: 0
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Choose a Package Template
      </DialogTitle>
      
      <DialogContent>
        {/* Filter Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {serviceTypes.map(type => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'contained' : 'outlined'}
              onClick={() => setSelectedType(type.value)}
              startIcon={type.icon}
              size="small"
            >
              {type.label}
            </Button>
          ))}
        </Box>

        {/* Template Grid */}
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {template.icon}
                    <Typography variant="h6">
                      {template.package_name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {template.description}
                  </Typography>
                  
                  <Typography variant="h6" color="primary" gutterBottom>
                    Starting from ₦{template.starting_price.toLocaleString()}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    {template.duration && (
                      <Chip 
                        label={`${template.duration} mins`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                    {template.max_output && (
                      <Chip 
                        label={`${template.max_output} deliverables`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <List dense>
                    {template.features.slice(0, 3).map((feature, idx) => (
                      <ListItem key={idx} disableGutters>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {template.features.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        +{template.features.length - 3} more features
                      </Typography>
                    )}
                  </List>
                </CardContent>
                
                <CardActions>
                  <Button 
                    fullWidth
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Use This Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ServicePackageTemplates;
