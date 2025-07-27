import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  Person 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // login, register, forgot
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);


  
  // Form data
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });

const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage({ type: '', text: '' });
  setLoading(true);

  try {
    if (mode === 'login') {
      const response = await api.post('/auth/login', {
        emailOrUsername: formData.emailOrUsername,
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      console.log('Token:', response.data.token);
      console.log('User:', response.data.user);
      
      login(response.data.token, response.data.user);
      
      console.log('After login call - checking localStorage:');
      console.log('Stored token:', localStorage.getItem('token'));
      console.log('Stored user:', localStorage.getItem('user'));
      
      navigate('/dashboard');
      
    } else if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        setLoading(false);
        return;
      }
      
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });
      
      // Check if approval is required
      if (response.data.requiresApproval) {
        setMessage({ 
          type: 'success', 
          text: response.data.message 
        });
        // Clear form
        setFormData({
          emailOrUsername: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          full_name: ''
        });
        // Switch to login mode after showing message
        setTimeout(() => {
          setMode('login');
        }, 5000);
      } else {
        // Admin created user - has token, log them in
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }
      
    } else if (mode === 'forgot') {
      await api.post('/auth/forgot-password', {
        email: formData.email
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Password reset instructions sent to your email' 
      });
    }
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error.response?.data?.message || 'An error occurred' 
    });
  } finally {
    setLoading(false);
  }
};


return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 400,
          mx: 2
        }}
      >
        {/* Logo/Title */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#7c3aed', fontWeight: 'bold' }}>
            Omega Studio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {mode === 'login' && 'Welcome back!'}
            {mode === 'register' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Login Form */}
          {mode === 'login' && (
            <>
              <TextField
                fullWidth
                label="Email or Username"
                value={formData.emailOrUsername}
                onChange={(e) => setFormData({...formData, emailOrUsername: e.target.value})}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Link 
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('forgot');
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            </>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                sx={{ mb: 2 }}
                helperText="At least 6 characters"
              />
              
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                sx={{ mb: 2 }}
                error={formData.confirmPassword && formData.password !== formData.confirmPassword}
              />
            </>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              sx={{ mb: 2 }}
              helperText="Enter your email to receive password reset instructions"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mb: 2,
              bgcolor: '#7c3aed',
              '&:hover': { bgcolor: '#6d28d9' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : (
              mode === 'login' ? 'Login' : 
              mode === 'register' ? 'Register' : 
              'Send Reset Link'
            )}
          </Button>
        </form>

        <Divider sx={{ my: 2 }} />

        {/* Mode Switcher */}
        {mode === 'login' && (
          <Typography variant="body2" align="center">
            Don't have an account?{' '}
            <Link 
              component="button"
              onClick={() => setMode('register')}
              sx={{ color: '#7c3aed' }}
            >
              Register here
            </Link>
          </Typography>
        )}
        
        {(mode === 'register' || mode === 'forgot') && (
          <Typography variant="body2" align="center">
            Already have an account?{' '}
            <Link 
              component="button"
              onClick={() => setMode('login')}
              sx={{ color: '#7c3aed' }}
            >
              Login here
            </Link>
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default Login;
