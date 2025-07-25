const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authMiddleware } = require('../middleware/auth');


// Debug middleware
router.use((req, res, next) => {
  console.log('Financial route hit:', req.method, req.path);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body exists:', !!req.body);
  console.log('Body content:', req.body);
  next();
});

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// All routes require authentication
router.use(authMiddleware);

// Dashboard
router.get('/dashboard', financialController.getDashboard);


// Banks
router.get('/banks', financialController.getBanks);
router.post('/banks', financialController.addBank);
router.delete('/banks/:id', financialController.deleteBank);

// Department stats
router.get('/department-stats', financialController.getDepartmentStats);


// Invoices
router.get('/invoices', financialController.getInvoices);
router.post('/invoices', financialController.createInvoice);
router.put('/invoices/:id', financialController.updateInvoice);
router.post('/invoices/:id/send', financialController.sendInvoice);
router.get('/invoices/:id/download', financialController.downloadInvoice);

// Payments
router.post('/payments', financialController.recordPayment);

// Expenses
router.get('/expenses', financialController.getExpenses);
router.post('/expenses', financialController.createExpense);
router.put('/expenses/:id', financialController.updateExpense);
router.put('/expenses/:id/status', financialController.updateExpenseStatus);


// Settings
router.get('/settings', financialController.getSettings);
router.put('/settings', financialController.updateSettings);

module.exports = router;
