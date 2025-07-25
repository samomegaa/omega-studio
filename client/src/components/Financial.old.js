import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  InputAdornment,
  Avatar,
  Box,
  Paper
} from '@mui/material';
import {
  Delete,
  AttachMoney,
  Receipt,
  TrendingUp,
  Warning,
  Add,
  Edit,
  Visibility,
  Email,
  Download,
  Payment,
  AccountBalance,
  DateRange,
  Business,
  Settings,
  Refresh,
  CheckCircle,
  Cancel,
  Print,
  Assessment,
  MoneyOff,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
    
  );
}

function Financial() {
  console.log('Financial component mounted');
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine initial tab based on route
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('invoices')) return 1;
    if (path.includes('expenses')) return 2;
    if (path.includes('overview')) return 0;
    if (path.includes('payments')) return 1; // Payments are in invoices tab
    return 0; // Default to dashboard
  };


  const [tabValue, setTabValue] = useState(getInitialTab());
   const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    outstandingAmount: 0,
    totalExpenses: 0,
    profit: 0,
    recentInvoices: [],
    monthlyRevenue: []
  });
  
  // Invoices
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  
  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
// ADD THESE NEW STATES HERE:
  const [openEditExpenseDialog, setOpenEditExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);  

  // Lookups
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [financialSettings, setFinancialSettings] = useState({});
// Add state for settings form
  const [settingsForm, setSettingsForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    tax_number: '',
    invoice_prefix: '',
    invoice_notes: ''
  });

  const [banks, setBanks] = useState([]);
  const [openBankDialog, setOpenBankDialog] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    account_type: 'current'
  });  


  // Filters
  const [filters, setFilters] = useState({
    start_date: startOfMonth(new Date()).toISOString().split('T')[0],
    end_date: endOfMonth(new Date()).toISOString().split('T')[0],
    status: '',
    client_id: ''
  });
  
  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    client_id: '',
    project_id: '',
    booking_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    notes: '',
    tax_rate: 7.5,
    discount_amount: 0
  });
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: '',
    reference_number: '',
    notes: ''
  });
  

// Expense form - update initial state
const [expenseForm, setExpenseForm] = useState({
  expense_date: new Date().toISOString().split('T')[0],
  category: '',
  vendor: '',
  description: '',
  amount: 0,
  payment_method: '',
  receipt_url: '',
  expense_type: 'company',
  project_id: '',
  client_id: '',
  department: ''
});

// Add expense types
const expenseTypes = [
  { value: 'company', label: 'Company (Global)' },
  { value: 'department', label: 'Department' },
  { value: 'project', label: 'Project' },
  { value: 'client', label: 'Client' }
];

// Add departments (you can fetch these from the API)
const departments = [
  'Recording Studio',
  'Photo Studio', 
  'Outside Project'
];


  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const expenseCategories = [
    'Equipment', 'Utilities', 'Rent', 'Salaries', 'Marketing',
    'Travel', 'Office Supplies', 'Software', 'Maintenance', 'Other'
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchInvoices();
    fetchExpenses();
    fetchClients();
    fetchProjects();
    fetchSettings();
    fetchBanks(); 
}, [filters]);
// After your other useEffects, add:
  useEffect(() => {
    setTabValue(getInitialTab());
  }, [location.pathname]);
  

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/financial/dashboard', { params: filters });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/financial/invoices', { params: filters });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/financial/expenses', { params: filters });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/financial/settings');
      setFinancialSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Add fetchBanks here (around line 295-305)
  const fetchBanks = async () => {
    try {
      const response = await api.get('/financial/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  // Add bank (line 307)
  const handleAddBank = async () => {

// Update financial settings
const handleUpdateSettings = async () => {
  try {
    await api.put('/financial/settings', settingsForm);
    setMessage({ type: 'success', text: 'Settings updated successfully' });
    fetchSettings();
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to update settings' });
  }
};

// Add bank
const handleAddBank = async () => {
  try {
    await api.post('/financial/banks', bankForm);
    setMessage({ type: 'success', text: 'Bank added successfully' });
    setOpenBankDialog(false);
    fetchBanks();
    setBankForm({
      bank_name: '',
      account_number: '',
      account_name: '',
      account_type: 'current'
    });
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to add bank' });
  }
};

// Delete bank
const handleDeleteBank = async (bankId) => {
  if (window.confirm('Are you sure you want to delete this bank?')) {
    try {
      await api.delete(`/financial/banks/${bankId}`);
      setMessage({ type: 'success', text: 'Bank deleted successfully' });
      fetchBanks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete bank' });
    }
  }
};

const handleCreateInvoice = async () => {
  try {
    // Validate items
    const validItems = invoiceForm.items.filter(item => 
      item.description && item.quantity > 0 && item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one valid item' });
      return;
    }
    
    // Convert empty strings to null for optional fields
    const invoiceData = {
      ...invoiceForm,
      project_id: invoiceForm.project_id || null,
      booking_id: invoiceForm.booking_id || null,
      discount_amount: invoiceForm.discount_amount || 0,
      notes: invoiceForm.notes || null,
      items: validItems
    };
    
    console.log('Sending invoice data:', invoiceData);
    
    const response = await api.post('/financial/invoices', invoiceData);
    
    setMessage({ type: 'success', text: 'Invoice created successfully' });
    setOpenInvoiceDialog(false);
    fetchInvoices();
    fetchDashboardData();
    
    // Reset form
    setInvoiceForm({
      client_id: '',
      project_id: '',
      booking_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      notes: '',
      tax_rate: 7.5,
      discount_amount: 0
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    setMessage({ 
      type: 'error', 
      text: error.response?.data?.message || 'Failed to create invoice' 
    });
  }
};

  const handleRecordPayment = async () => {
    try {
      await api.post('/financial/payments', paymentForm);
      setMessage({ type: 'success', text: 'Payment recorded successfully' });
      setOpenPaymentDialog(false);
      fetchInvoices();
      fetchDashboardData();
      
      // Reset form
      setPaymentForm({
        invoice_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: '',
        reference_number: '',
        notes: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to record payment' 
      });
    }
  };

// Add a loading state for expense creation
const [creatingExpense, setCreatingExpense] = useState(false);

const handleCreateExpense = async () => {
  // Prevent double submission
  if (creatingExpense) return;
  
  try {
    setCreatingExpense(true);
    console.log('Expense form data:', expenseForm);
    
    // Validate amount
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      setCreatingExpense(false);
      return;
    }
    
    await api.post('/financial/expenses', expenseForm);
    setMessage({ type: 'success', text: 'Expense recorded successfully' });
    setOpenExpenseDialog(false);
    fetchExpenses();
    fetchDashboardData();
    
    // Reset form
    setExpenseForm({
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      vendor: '',
      description: '',
      amount: 0,
      payment_method: '',
      receipt_url: '',
      expense_type: 'company',
      project_id: '',
      client_id: '',
      department: ''
    });
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error.response?.data?.message || 'Failed to record expense' 
    });
  } finally {
    setCreatingExpense(false);
  }
};
  
  // ADD THESE NEW FUNCTIONS HERE:
  // Update expense status (for admin approval)
  const handleUpdateExpenseStatus = async (expenseId, newStatus) => {
    try {
      await api.put(`/financial/expenses/${expenseId}/status`, { status: newStatus });
      setMessage({ type: 'success', text: 'Expense status updated' });
      fetchExpenses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

// Get department performance
const getDepartmentStats = () => {
  const departmentExpenses = {};
  
  departments.forEach(dept => {
    departmentExpenses[dept] = expenses
      .filter(exp => exp.expense_type === 'department' && exp.department === dept)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  });
  
  return departmentExpenses;
};

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      expense_date: expense.expense_date.split('T')[0],
      category: expense.category,
      vendor: expense.vendor || '',
      description: expense.description || '',
      amount: expense.amount,
      payment_method: expense.payment_method || '',
      receipt_url: expense.receipt_url || '',
      expense_type: expense.expense_type || 'company',
      project_id: expense.project_id || '',
      client_id: expense.client_id || '',
      department: expense.department || ''
    });
    setOpenEditExpenseDialog(true);
  };

  // Update expense
  const handleUpdateExpense = async () => {
    try {
      await api.put(`/financial/expenses/${editingExpense.id}`, expenseForm);
      setMessage({ type: 'success', text: 'Expense updated successfully' });
      setOpenEditExpenseDialog(false);
      fetchExpenses();
      // Reset form
      setExpenseForm({
        expense_date: new Date().toISOString().split('T')[0],
        category: '',
        vendor: '',
        description: '',
        amount: 0,
        payment_method: '',
        receipt_url: '',
        expense_type: 'company',
        project_id: '',
        client_id: '',
        department: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update expense' });
    }
  };








  const handleUpdateInvoiceStatus = async (invoiceId, status) => {
    try {
      await api.put(`/financial/invoices/${invoiceId}/status`, { status });
      setMessage({ type: 'success', text: 'Invoice status updated' });
      fetchInvoices();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleUpdateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleRemoveInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateInvoiceTotal = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => 
      sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0
    );
    const taxAmount = (subtotal - parseFloat(invoiceForm.discount_amount || 0)) * parseFloat(invoiceForm.tax_rate || 0) / 100;
    return subtotal - parseFloat(invoiceForm.discount_amount || 0) + taxAmount;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'primary',
      paid: 'success',
      overdue: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Financial Management</Typography>
        <Box>
          <IconButton onClick={() => {
            fetchDashboardData();
            fetchInvoices();
            fetchExpenses();
          }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Dashboard" icon={<Assessment />} />
          <Tab label="Invoices" icon={<Receipt />} />
          <Tab label="Expenses" icon={<MoneyOff />} />
          {isAdmin && <Tab label="Settings" icon={<Settings />} />}
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.totalRevenue)}
                      </Typography>
                    </Box>
                    <AttachMoney color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Outstanding
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.outstandingAmount)}
                      </Typography>
                    </Box>
                    <Warning color="warning" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Total Expenses
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.totalExpenses)}
                      </Typography>
                    </Box>
                    <MoneyOff color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Net Profit
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.profit)}
                      </Typography>
                    </Box>
                    <TrendingUp color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>


{/* In Dashboard Tab, add after the summary cards */}
<Grid item xs={12}>
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Department Expenses
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(getDepartmentStats()).map(([dept, amount]) => (
          <Grid item xs={12} sm={4} key={dept}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {dept}
              </Typography>
              <Typography variant="h6">
                {formatCurrency(amount)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
</Grid>






            {/* Recent Invoices */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Invoices
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice #</TableCell>
                          <TableCell>Client</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.recentInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.client_name}</TableCell>
                            <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={invoice.status} 
                                color={getStatusColor(invoice.status)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Invoices Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Invoices</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenInvoiceDialog(true)}
            >
              Create Invoice
            </Button>
          </Box>

          <Box mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={filters.client_id}
                    label="Client"
                    onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {clients.map(client => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell>{invoice.project_title || '-'}</TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.paid_amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status} 
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
<Tooltip title="View">
  <IconButton 
    size="small"
    onClick={() => {
      // For now, just open the invoice details
      setSelectedInvoice(invoice);
      setOpenInvoiceDialog(true);
    }}
  >
    <Visibility />
  </IconButton>
</Tooltip>
                      {invoice.status === 'draft' && (
                        <Tooltip title="Send">
                          <IconButton 
                            size="small"
                            onClick={() => handleUpdateInvoiceStatus(invoice.id, 'sent')}
                          >
                            <Email />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Tooltip title="Record Payment">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setPaymentForm({
                                ...paymentForm,
                                invoice_id: invoice.id,
                                amount: invoice.total_amount - invoice.paid_amount
                              });
                              setOpenPaymentDialog(true);
                            }}
                          >
                            <Payment />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Expenses Tab */}
        <TabPanel value={tabValue} index={2}>
         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
           <Typography variant="h6">Expenses</Typography>
            <Button
              variant="contained"
             startIcon={<Add />}
              onClick={() => setOpenExpenseDialog(true)}
            >
             Record Expense
           </Button>
     /    </Box>


<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>Category</TableCell>
        <TableCell>Vendor</TableCell>
        <TableCell>Description</TableCell>
        <TableCell>Assigned To</TableCell>
        <TableCell align="right">Amount</TableCell>
        <TableCell>Payment Method</TableCell>
        <TableCell>Status</TableCell>
	<TableCell>Actions</TableCell> 
      </TableRow>
    </TableHead>
    <TableBody>
      {expenses.map((expense) => (
        <TableRow key={expense.id}>
          <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
          <TableCell>{expense.category}</TableCell>
          <TableCell>{expense.vendor || '-'}</TableCell>
          <TableCell>{expense.description}</TableCell>
          <TableCell>
            {expense.expense_type === 'company' && 'Company'}
            {expense.expense_type === 'department' && `Dept: ${expense.department}`}
            {expense.expense_type === 'project' && expense.project_title}
            {expense.expense_type === 'client' && expense.client_name}
          </TableCell>
          <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
          <TableCell>{expense.payment_method || '-'}</TableCell>
          <TableCell>
            <Chip 
              label={expense.status} 
              color={expense.status === 'approved' ? 'success' : 
                     expense.status === 'rejected' ? 'error' : 'warning'}
              size="small"
            />
          </TableCell>


<TableCell>
  <Chip 
    label={expense.status} 
    color={expense.status === 'approved' ? 'success' : 
           expense.status === 'rejected' ? 'error' : 'warning'}
    size="small"
  />
</TableCell>
<TableCell>
  <Tooltip title="Edit">
    <IconButton size="small" onClick={() => handleEditExpense(expense)}>
      <Edit />
    </IconButton>
  </Tooltip>
  {isAdmin && expense.status === 'pending' && (
    <>
      <Tooltip title="Approve">
        <IconButton 
          size="small" 
          color="success"
          onClick={() => handleUpdateExpenseStatus(expense.id, 'approved')}
        >
          <CheckCircle />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reject">
        <IconButton 
          size="small" 
          color="error"
          onClick={() => handleUpdateExpenseStatus(expense.id, 'rejected')}
        >
          <Cancel />
        </IconButton>
      </Tooltip>
    </>
  )}
</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

 </TabPanel>


  <TabPanel value={tabValue} index={3}>
    <Typography variant="h6" gutterBottom>
      Financial Settings
    </Typography>
    
    <Grid container spacing={3}>
      {/* Company Information */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Company Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Name"
          value={settingsForm.company_name || financialSettings.company_name || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Tax Number"
          value={settingsForm.tax_number || financialSettings.tax_number || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, tax_number: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Company Address"
          value={settingsForm.company_address || financialSettings.company_address || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, company_address: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Phone"
          value={settingsForm.company_phone || financialSettings.company_phone || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, company_phone: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company Email"
          value={settingsForm.company_email || financialSettings.company_email || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, company_email: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Invoice Prefix"
          value={settingsForm.invoice_prefix || financialSettings.invoice_prefix || ''}
          onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Button variant="contained" onClick={handleUpdateSettings}>
          Update Company Settings
        </Button>
      </Grid>
      
      {/* Bank Information */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <Typography variant="subtitle1">
            Bank Accounts
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenBankDialog(true)}
          >
            Add Bank
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bank Name</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Account Type</TableCell>
                <TableCell>Primary</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>{bank.bank_name}</TableCell>
                  <TableCell>{bank.account_name || '-'}</TableCell>
                  <TableCell>{bank.account_number || '-'}</TableCell>
                  <TableCell>{bank.account_type || '-'}</TableCell>
                  <TableCell>
                    {bank.is_primary && <CheckCircle color="success" />}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  </TabPanel>
)}
 </Paper>

{/* Edit Expense Dialog */}
<Dialog open={openEditExpenseDialog} onClose={() => setOpenEditExpenseDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Expense</DialogTitle>
  <DialogContent>
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="date"
            label="Expense Date"
            value={expenseForm.expense_date}
            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
      </Grid>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEditExpenseDialog(false)}>Cancel</Button>
    <Button onClick={handleUpdateExpense} variant="contained">Update Expense</Button>
  </DialogActions>
</Dialog>
{/* Add Bank Dialog */}
<Dialog open={openBankDialog} onClose={() => setOpenBankDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Add Bank Account</DialogTitle>
  <DialogContent>
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bank Name"
            value={bankForm.bank_name}
            onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Account Name"
            value={bankForm.account_name}
            onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Account Number"
            value={bankForm.account_number}
            onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Account Type</InputLabel>
            <Select
              value={bankForm.account_type}
              label="Account Type"
              onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
            >
              <MenuItem value="current">Current</MenuItem>
              <MenuItem value="savings">Savings</MenuItem>
              <MenuItem value="fixed">Fixed Deposit</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenBankDialog(false)}>Cancel</Button>
    <Button onClick={handleAddBank} variant="contained">Add Bank</Button>
  </DialogActions>
</Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={openInvoiceDialog} onClose={() => setOpenInvoiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={invoiceForm.client_id}
                    label="Client"
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })}
                  >
                    {clients.map(client => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={invoiceForm.project_id}
                    label="Project"
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, project_id: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {projects
                      .filter(p => !invoiceForm.client_id || p.client_id === parseInt(invoiceForm.client_id))
                      .map(project => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.title}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue Date"
                  value={invoiceForm.issue_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Invoice Items
                </Typography>
                {invoiceForm.items.map((item, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleUpdateInvoiceItem(index, 'description', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleUpdateInvoiceItem(index, 'quantity', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateInvoiceItem(index, 'unit_price', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₦</InputAdornment>
                        }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" alignItems="center" height="100%">
                        <Typography>
                          {formatCurrency(item.quantity * item.unit_price)}
                        </Typography>
                        {invoiceForm.items.length > 1 && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveInvoiceItem(index)}
                            sx={{ ml: 1 }}
                          >
                            <Cancel />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                ))}
                <Button 
                  startIcon={<Add />} 
                  onClick={handleAddInvoiceItem}
                  size="small"
                >
                  Add Item
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tax Rate (%)"
                  value={invoiceForm.tax_rate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount"
                  value={invoiceForm.discount_amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Typography variant="h6">
                    Total: {formatCurrency(calculateInvoiceTotal())}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvoiceDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateInvoice} variant="contained">Create Invoice</Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payment Date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentForm.payment_method}
                    label="Payment Method"
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  >
                    {paymentMethods.map(method => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained">Record Payment</Button>
        </DialogActions>
</Dialog>



{/* Create Expense Dialog */}
<Dialog open={openExpenseDialog} onClose={() => setOpenExpenseDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Record Expense</DialogTitle>
  <DialogContent>
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="date"
            label="Expense Date"
            value={expenseForm.expense_date}
            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
{/* Amount field */}
<Grid item xs={12}>
  <TextField
    fullWidth
    type="number"
    label="Amount"
    value={expenseForm.amount}
    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
    InputProps={{
      startAdornment: <InputAdornment position="start">₦</InputAdornment>
    }}
    required
  />
</Grid>

{/* Vendor field */}
<Grid item xs={12}>
  <TextField
    fullWidth
    label="Vendor"
    value={expenseForm.vendor}
    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
  />
</Grid>

{/* Description field */}
<Grid item xs={12}>
  <TextField
    fullWidth
    label="Description"
    value={expenseForm.description}
    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
    multiline
    rows={2}
    required
  />
</Grid>

{/* Payment Method field */}
<Grid item xs={12}>
  <FormControl fullWidth>
    <InputLabel>Payment Method</InputLabel>
    <Select
      value={expenseForm.payment_method}
      label="Payment Method"
      onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
    >
      <MenuItem value="">None</MenuItem>
      {paymentMethods.map(method => (
        <MenuItem key={method.value} value={method.value}>
          {method.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Grid>

        {/* Expense Type Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Expense Type</InputLabel>
            <Select
              value={expenseForm.expense_type}
              label="Expense Type"
              onChange={(e) => setExpenseForm({ 
                ...expenseForm, 
                expense_type: e.target.value,
                // Reset fields when type changes
                project_id: '',
                client_id: '',
                department: ''
              })}
            >
              {expenseTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Show department field if department type selected */}
        {expenseForm.expense_type === 'department' && (
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={expenseForm.department}
                label="Department"
                onChange={(e) => setExpenseForm({ ...expenseForm, department: e.target.value })}
              >
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Show project field if project type selected */}
        {expenseForm.expense_type === 'project' && (
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Project</InputLabel>
              <Select
                value={expenseForm.project_id}
                label="Project"
                onChange={(e) => setExpenseForm({ ...expenseForm, project_id: e.target.value })}
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Show client field if client type selected */}
        {expenseForm.expense_type === 'client' && (
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Client</InputLabel>
              <Select
                value={expenseForm.client_id}
                label="Client"
                onChange={(e) => setExpenseForm({ ...expenseForm, client_id: e.target.value })}
              >
                {clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={expenseForm.category}
              label="Category"
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            >
              {expenseCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* ... rest of the expense form fields ... */}
      </Grid>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenExpenseDialog(false)}>Cancel</Button>
    <Button onClick={handleCreateExpense} variant="contained">Record Expense</Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}
export default Financial;
