import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Assignment,
  Person,
  CalendarToday,
  AttachMoney,
  AccessTime,
  Assessment,
  ExpandLess,
  ExpandMore,
  AccountCircle,
  Logout,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenus, setOpenMenus] = useState({});

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSubmenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Menu items based on user role
  const getMenuItems = () => {
    // Define all possible menu items with their role restrictions
    const allMenuItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
        roles: ['admin', 'madmin', 'engineer', 'staff', 'client']
      },
      {
        text: 'User Management',
        icon: <People />,
        path: '/users',
        roles: ['admin']
      },
      {
        text: 'Projects',
        icon: <Assignment />,
        path: '/projects',
        roles: ['admin', 'madmin', 'engineer']
      },
      {
        text: 'Clients',
        icon: <Person />,
        path: '/clients',
        roles: ['admin', 'madmin', 'engineer']
      },
      {
        text: 'Studio Booking',
        icon: <CalendarToday />,
        path: '/bookings',
        roles: ['admin', 'madmin', 'engineer', 'client']
      },
      {
        text: 'Financial',
        icon: <AttachMoney />,
        submenu: [
          { text: 'Invoices', path: '/invoices' },
          { text: 'Payments', path: '/payments' },
          { text: 'Financial Overview', path: '/financial' }
        ],
        roles: ['admin', 'madmin'] // Engineers removed from financial access
      },
      {
        text: 'Staff Attendance',
        icon: <AccessTime />,
        path: '/attendance',
        roles: ['admin', 'madmin', 'engineer', 'staff'] // Available to all except clients
      },
      {
        text: 'Reports',
        icon: <Assessment />,
        submenu: [
          { text: 'Financial Reports', path: '/reports/financial' },
          { text: 'Project Reports', path: '/reports/projects' },
          { text: 'Studio Analytics', path: '/reports/analytics' }
        ],
        roles: ['admin', 'madmin'] // Only admin and madmin
      }
    ];

    // Filter menu items based on user role
    return allMenuItems.filter(item => 
      item.roles.some(role => user?.roles?.includes(role)) || item.roles.includes('staff')
    );
  };

  const menuItems = getMenuItems();

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: '#7c3aed', color: 'white' }}>
        <Typography variant="h6" noWrap component="div">
          Omega Studio
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.text);
                  } else {
                    navigate(item.path);
                    setMobileOpen(false);
                  }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.submenu && (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            {item.submenu && (
              <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => {
                        navigate(subItem.path);
                        setMobileOpen(false);
                      }}
                    >
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#7c3aed'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Omega Studio'}
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            onClick={handleProfileMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
          >
          
            <MenuItem onClick={() => { navigate('/profile'); handleCloseMenu(); }}>
              <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
