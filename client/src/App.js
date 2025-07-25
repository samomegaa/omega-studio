import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Bookings from './components/Bookings';
//import Invoices from './components/Invoices';
import Attendance from './components/Attendance';
import Reports from './components/Reports';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Financial from './components/Financial';
import Profile from './components/Profile';
const theme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed',
    },
    secondary: {
      main: '#10b981',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
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
		      <Route path="/profile" element={<Profile />} />  {/* Add this line */}                      
		      <Route path="/reports/*" element={<Reports />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
		       </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
