import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, Card, CardContent, AppBar, Toolbar } from '@mui/material';
import { Mic, CameraAlt, Star, People, Schedule, EmojiEvents, Videocam } from '@mui/icons-material';

function LandingPage() {
  const navigate = useNavigate();

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Navigation */}
      <AppBar position="sticky" sx={{ bgcolor: '#1a1a2e' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            🎵 Omega Recording Studio
          </Typography>
          <Button color="inherit" onClick={() => scrollToSection('services')}>Services</Button>
          <Button color="inherit" onClick={() => scrollToSection('features')}>Features</Button>
          <Button color="inherit" onClick={() => scrollToSection('contact')}>Contact</Button>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => navigate('/login')}
            sx={{ ml: 2 }}
          >
            Login
          </Button>
          <Button 
            variant="contained" 
            sx={{ 
              ml: 1, 
              bgcolor: '#7c3aed',
              '&:hover': { bgcolor: '#6d28d9' }
            }}
            onClick={() => navigate('/register')}
          >
            Register
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Welcome to Omega Recording Studio
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Professional Recording & Photography Services
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                mr: 2,
                bgcolor: 'white',
                color: '#7c3aed',
                '&:hover': { bgcolor: '#f3f4f6' }
              }}
              onClick={() => scrollToSection('services')}
            >
              Explore Services
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: 'white',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => navigate('/login')}
            >
              Book Now
            </Button>
          </Box>
        </Container>
      </Box>



{/* Services Section */}
<Container id="services" maxWidth="lg" sx={{ py: 8 }}>
  <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom>
    Our Services
  </Typography>
  
  <Grid container spacing={4} sx={{ mt: 2 }}>
    {/* Recording Studio */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%', p: 3, cursor: 'pointer', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Mic sx={{ fontSize: 60, color: '#7c3aed', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="#7c3aed">
            Recording Studio
          </Typography>
          <Typography paragraph>
            Music Production and Audio Recording
          </Typography>
          <Box sx={{ textAlign: 'left', mt: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>• Professional mixing and mastering</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Multi-track recording</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Voice-over services</Typography>
            <Typography variant="body1">• Podcast production</Typography>
          </Box>
          <Button 
            variant="contained" 
            sx={{ mt: 3, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
            onClick={() => navigate('/services/recording')}
          >
            Learn More & Book
          </Button>
        </CardContent>
      </Card>
    </Grid>

    {/* Photo Studio */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%', p: 3, cursor: 'pointer', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <CameraAlt sx={{ fontSize: 60, color: '#7c3aed', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="#7c3aed">
            Photo Studio
          </Typography>
          <Typography paragraph>
            Professional Photography Services
          </Typography>
          <Box sx={{ textAlign: 'left', mt: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>• Portrait photography</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Product photography</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Fashion photography</Typography>
            <Typography variant="body1">• Photo editing services</Typography>
          </Box>
          <Button 
            variant="contained" 
            sx={{ mt: 3, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
            onClick={() => navigate('/services/photography')}
          >
            Learn More & Book
          </Button>
        </CardContent>
      </Card>
    </Grid>

    {/* Outside Recording */}
    <Grid item xs={12} md={4}>
      <Card sx={{ height: '100%', p: 3, cursor: 'pointer', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Videocam sx={{ fontSize: 60, color: '#7c3aed', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="#7c3aed">
            Outside Recording
          </Typography>
          <Typography paragraph>
            Event Coverage & Documentation
          </Typography>
          <Box sx={{ textAlign: 'left', mt: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>• Wedding coverage</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Corporate events</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>• Burial ceremonies</Typography>
            <Typography variant="body1">• Social events</Typography>
          </Box>
          <Button 
            variant="contained" 
            sx={{ mt: 3, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
            onClick={() => navigate('/services/outside-recording')}
          >
            Learn More & Book
          </Button>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Container>

      {/* Why Choose Omega Section */}
      <Box id="features" sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom>
            Why Choose Omega?
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#7c3aed', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <Star sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Premium Equipment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Industry-standard recording and photography equipment
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#7c3aed', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <People sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Expert Team
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Experienced professionals dedicated to your project
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#7c3aed', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <Schedule sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Flexible Booking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Easy online booking system with real-time availability
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#7c3aed', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}>
                  <EmojiEvents sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quality Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We deliver exceptional results that exceed expectations
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact" sx={{ bgcolor: '#2d2d2d', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom>
            Get In Touch
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                📍 7, 42nd Avenue, Shagari Villa,
              </Typography>
              <Typography variant="body1">
                Akure, Ondo State, Nigeria
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                ✉️ studio@omegastudioakure.com
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                📞 +234 906 126 7300
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body1">
                📱 +234 903 143 6895
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                🌐 www.omegastudioakure.com
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                bgcolor: '#7c3aed',
                '&:hover': { bgcolor: '#6d28d9' }
              }}
              onClick={() => navigate('/login')}
            >
              Start Your Project
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 6, pt: 4, borderTop: '1px solid #444' }}>
            <Typography variant="body2" color="text.secondary">
              © 2024 Omega Recording Studio. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;
