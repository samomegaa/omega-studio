import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import Login from './components/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Bookings from './components/Bookings';
import Financial from './components/Financial';
import Attendance from './components/Attendance';
import Profile from './components/Profile';
import Reports from './components/Reports';
import LandingPage from './components/LandingPage';
import RecordingService from './components/services/RecordingService';
import PhotographyService from './components/services/PhotographyService';
import OutsideRecordingService from './components/services/OutsideRecordingService';
import ServicePackageManager from './components/ServicePackageManager';

// Separate component that uses useAuth
function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/services/recording" element={<RecordingService />} />
      <Route path="/services/photography" element={<PhotographyService />} />
      <Route path="/services/outside-recording" element={<OutsideRecordingService />} />
<Route path="/service-packages" element={<ServicePackageManager />} />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/invoices" element={<Navigate to="/financial" />} />
                <Route path="/payments" element={<Navigate to="/financial" />} />
                <Route path="/financial-overview" element={<Navigate to="/financial" />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/reports/*" element={<Reports />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
