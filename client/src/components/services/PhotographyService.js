import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, CardActions, 
  Typography, Button, Box, Chip, List, ListItem, 
  ListItemIcon, ListItemText 
} from '@mui/material';
import { CheckCircle, Settings, Videocam } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ServicePackageManagement from '../ServicePackageManagement';
import api from '../../services/api';

function OutsideRecordingService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [openManagement, setOpenManagement] = useState(false);
  
  const canManagePackages = user && (
    user.roles?.includes('admin') || 
    user.roles?.includes('madmin')
  );

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/service-packages');
      // Filter for videography/outside recording packages
      const videographyPackages = response.data.filter(
        pkg => (pkg.service_type === 'videography' || pkg.service_type === 'outside') && pkg.is_active
      );
      setPackages(videographyPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages(getDefaultPackages());
    }
  };

  const getDefaultPackages = () => [
    {
      id: 1,
      package_name: 'Event Coverage',
      starting_price: 50000,
      features: [
        'Professional videography',
        'Multi-camera setup',
        'Event highlights video',
        'Full event documentation',
        'Same-day preview'
      ]
    },
    {
      id: 2,
      package_name: 'Corporate Video',
      starting_price: 75000,
      features: [
        'Corporate event coverage',
        'Professional interviews',
        'Branded content creation',
        'Social media cuts',
        'Professional editing'
      ]
    },
    {
      id: 3,
      package_name: 'Wedding Videography',
      starting_price: 100000,
      features: [
        'Full wedding coverage',
        'Cinematic highlights',
        'Drone footage',
        'Multiple videographers',
        'Premium editing & color grading'
      ]
    },
    {
      id: 4,
      package_name: 'Documentary Production',
      starting_price: 150000,
      features: [
        'Full documentary production',
        'Research & scripting',
        'Multiple location shoots',
        'Professional narration',
        'Complete post-production'
      ]
    }
  ];

  const handleBookService = (packageId) => {
    navigate('/booking', { state: { serviceType: 'videography', packageId } });
  };

  const displayPackages = packages.length > 0 ? packages : getDefaultPackages();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Outside Recording & Videography
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Event coverage and professional video production services
          </Typography>
        </Box>
        
        {canManagePackages && (
          <Button
            variant="contained"
            startIcon={<Settings />}
            onClick={() => setOpenManagement(true)}
            sx={{ height: 'fit-content' }}
          >
            Manage Packages
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        {displayPackages.map((pkg) => (
          <Grid item xs={12} sm={6} md={6} key={pkg.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2,
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Videocam sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="h5" component="h2">
                    {pkg.package_name}
                  </Typography>
                </Box>

                <Typography variant="h6" color="primary" gutterBottom>
                  Starting from ₦{Number(pkg.starting_price || pkg.price).toLocaleString()}
                </Typography>

                {pkg.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {pkg.description}
                  </Typography>
                )}

                <List dense>
                  {pkg.features.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Box mt={2}>
                  {pkg.duration && (
                    <Chip 
                      label={`Duration: ${pkg.duration} mins`} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                  )}
                  {pkg.max_output && (
                    <Chip 
                      label={`Deliverables: ${pkg.max_output}`} 
                      size="small" 
                    />
                  )}
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={() => handleBookService(pkg.id)}
                >
                  BOOK THIS SERVICE
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {canManagePackages && (
        <ServicePackageManagement 
          open={openManagement}
          onClose={() => {
            setOpenManagement(false);
            fetchPackages();
          }}
defaultServiceType="photography"  // Add this
        />
      )}
    </Container>
  );
}

export default OutsideRecordingService;
