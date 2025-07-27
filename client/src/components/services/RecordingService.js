import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, CardActions, 
  Typography, Button, Box, Chip, List, ListItem, 
  ListItemIcon, ListItemText 
} from '@mui/material';
import { CheckCircle, Settings, Mic } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ServicePackageManagement from '../ServicePackageManagement';
import api from '../../services/api';

function RecordingService() {
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
      const recordingPackages = response.data.filter(
        pkg => pkg.service_type === 'recording' && pkg.is_active
      );
      setPackages(recordingPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages(getDefaultPackages());
    }
  };

  const getDefaultPackages = () => [
    {
      id: 1,
      package_name: 'Basic Recording Session',
      starting_price: 10000,
      features: [
        'Professional recording equipment',
        'Sound engineer assistance',
        'Basic mixing',
        '2 hours studio time'
      ]
    },
    {
      id: 2,
      package_name: 'Professional Recording',
      starting_price: 25000,
      features: [
        'Premium recording equipment',
        'Expert sound engineer',
        'Advanced mixing & mastering',
        '4 hours studio time',
        'Multiple takes & editing'
      ]
    },
    {
      id: 3,
      package_name: 'Album Production',
      starting_price: 100000,
      features: [
        'Full album production',
        'Unlimited studio time',
        'Professional mixing & mastering',
        'Creative direction',
        'Guest musician coordination'
      ]
    },
    {
      id: 4,
      package_name: 'Voice Over Recording',
      starting_price: 8000,
      features: [
        'Professional voice recording',
        'Script assistance',
        'Multiple format delivery',
        'Noise reduction & clarity enhancement'
      ]
    }
  ];

  const handleBookService = (packageId) => {
    navigate('/booking', { state: { serviceType: 'recording', packageId } });
  };

  const displayPackages = packages.length > 0 ? packages : getDefaultPackages();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Recording Studio Services
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Professional music production and audio recording
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
                    <Mic sx={{ color: 'white' }} />
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

                {pkg.duration && (
                  <Chip 
                    label={`Duration: ${pkg.duration} mins`} 
                    size="small" 
                    sx={{ mt: 1, mr: 1 }}
                  />
                )}
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
 defaultServiceType="recording"  // Add this
        />
      )}
    </Container>
  );
}

export default RecordingService;
