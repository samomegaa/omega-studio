import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography,
  Chip, Box, IconButton, Collapse,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Button
} from '@mui/material';
import {
  ExpandMore, ExpandLess, History,
  Create, Edit, Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

function ServicePackageActivityLog({ open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    action: 'all',
    userId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await api.get(`/service-packages/logs?${params}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (logId) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <Create color="success" />;
      case 'updated': return <Edit color="primary" />;
      case 'deleted': return <Delete color="error" />;
      default: return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'primary';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const renderChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Changes Made:</Typography>
        {Object.entries(changes).map(([field, change]) => (
          <Box key={field} sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>{field}:</strong>
            </Typography>
            <Typography variant="body2" color="error" component="span">
              From: {JSON.stringify(change.from)}
            </Typography>
            <Typography variant="body2" sx={{ mx: 1 }} component="span">→</Typography>
            <Typography variant="body2" color="success.main" component="span">
              To: {JSON.stringify(change.to)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <History />
          Service Package Activity Log
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              label="Action"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="created">Created</MenuItem>
              <MenuItem value="updated">Updated</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          
          <Button variant="outlined" onClick={fetchLogs}>
            Apply Filters
          </Button>
        </Box>

        {/* Logs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50}></TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Package</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow hover>
                    <TableCell>
                      {getActionIcon(log.action)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action} 
                        size="small" 
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>{log.package_name || 'Deleted Package'}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={() => toggleRow(log.id)}
                      >
                        {expandedRows[log.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0 }}>
                      <Collapse in={expandedRows[log.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          {log.changes && renderChanges(log.changes)}
                          {log.new_values && log.action === 'created' && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2">Created with values:</Typography>
                              <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </Box>
                          )}
                          {log.previous_values && log.action === 'deleted' && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2">Deleted package details:</Typography>
                              <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                                {JSON.stringify(log.previous_values, null, 2)}
                              </pre>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {logs.length === 0 && !loading && (
          <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
            No activity logs found
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ServicePackageActivityLog;
