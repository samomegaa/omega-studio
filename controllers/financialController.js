const pool = require('../config/db');
const PDFDocument = require('pdfkit');





// Get all banks
//exports.getBanks = async (req, res) => {
 // try {
   // const result = await pool.query('SELECT * FROM financial_banks ORDER BY created_at DESC');
   // res.json(result.rows);
  //} catch (error) {
  //  res.status(500).json({ message: 'Error fetching banks' });
 // }
//};

// Minimal implementations for required routes
//exports.addBank = async (req, res) => {
 // res.status(501).json({ message: 'Not implemented' });
//};

//exports.deleteBank = async (req, res) => {
 // res.status(501).json({ message: 'Not implemented' });
//};

exports.getBanks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_banks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ message: 'Error fetching banks' });
  }
};

exports.addBank = async (req, res) => {
  try {
    const { bank_name, account_number, account_name, account_type, is_primary } = req.body;
    
    // If this bank is set as primary, unset other primary banks
    if (is_primary) {
      await pool.query('UPDATE financial_banks SET is_primary = false WHERE is_primary = true');
    }
    
    const result = await pool.query(
      `INSERT INTO financial_banks (bank_name, account_number, account_name, account_type, is_primary) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [bank_name, account_number, account_name, account_type, is_primary || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding bank:', error);
    res.status(500).json({ message: 'Error adding bank' });
  }
};

exports.deleteBank = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM financial_banks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({ message: 'Error deleting bank' });
  }
};




exports.getDepartmentStats = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.getInvoices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

exports.getInvoiceById = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.createInvoice = async (req, res) => {
  res.status(501).json({ message: 'Invoice creation temporarily disabled' });
};

exports.updateInvoiceStatus = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.downloadInvoice = async (req, res) => {
  res.status(501).json({ message: 'PDF download temporarily disabled' });
};

exports.sendInvoice = async (req, res) => {
  res.status(501).json({ message: 'Invoice sending temporarily disabled' });
};

exports.recordPayment = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.updateInvoice = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.getExpenses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
};

exports.createExpense = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.updateExpense = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.updateExpenseStatus = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

exports.getDashboard = async (req, res) => {
  res.json({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    recentTransactions: []
  });
};

exports.getSettings = async (req, res) => {
  res.json({});
};

exports.updateSettings = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};
