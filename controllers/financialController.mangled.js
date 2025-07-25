const express = require('express');
const pool = require('../config/db');
const PDFDocument = require('pdfkit'); 

// Generate invoice number
const generateInvoiceNumber = async () => {
  const settings = await pool.query('SELECT invoice_prefix FROM financial_settings WHERE id = 1');
  const prefix = settings.rows[0]?.invoice_prefix || 'INV';
  
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get the latest invoice number for this month
  const latest = await pool.query(
    `SELECT invoice_number FROM invoices 
     WHERE invoice_number LIKE $1 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}${year}${month}%`]
  );
  
  let sequence = 1;
  if (latest.rows.length > 0) {
    const lastNumber = latest.rows[0].invoice_number;
    const lastSequence = parseInt(lastNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${year}${month}${String(sequence).padStart(4, '0')}`;
};

// Get banks
exports.getBanks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_banks ORDER BY is_primary DESC, bank_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ message: 'Error fetching banks' });
  }
};

// Add bank
exports.addBank = async (req, res) => {
  try {
    const { user } = req;
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { bank_name, account_number, account_name, account_type } = req.body;
    
    const result = await pool.query(`
      INSERT INTO financial_banks (bank_name, account_number, account_name, account_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [bank_name, account_number, account_name, account_type]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding bank:', error);
    res.status(500).json({ message: 'Error adding bank' });
  }
};

// Delete bank
exports.deleteBank = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    await pool.query('DELETE FROM financial_banks WHERE id = $1', [id]);
    res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({ message: 'Error deleting bank' });
  }
};

// Get department statistics
exports.getDepartmentStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        department,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expenses
      WHERE expense_type = 'department'
      AND status = 'approved'
    `;
    
    const queryParams = [];
    if (start_date && end_date) {
      query += ' AND expense_date BETWEEN $1 AND $2';
      queryParams.push(start_date, end_date);
    }
    
    query += ' GROUP BY department';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ message: 'Error fetching department stats' });
  }
};



// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const { status, client_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        p.title as project_title
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND i.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    if (client_id) {
      query += ` AND i.client_id = $${paramCount}`;
      queryParams.push(client_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND i.issue_date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND i.issue_date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    
    // Update overdue status
    const today = new Date().toISOString().split('T')[0];
    for (const invoice of result.rows) {
      if (invoice.status === 'sent' && invoice.due_date < today) {
        await pool.query(
          'UPDATE invoices SET status = $1 WHERE id = $2',
          ['overdue', invoice.id]
        );
        invoice.status = 'overdue';
      }
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

// Get single invoice with items
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoiceResult = await pool.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        p.title as project_title,
        b.booking_number,
        u.full_name as created_by_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN bookings b ON i.booking_id = b.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1
    `, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    );
    
    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [id]
    );
    
    res.json({
      ...invoiceResult.rows[0],
      items: itemsResult.rows,
      payments: paymentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
};


exports.createInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      client_id, project_id, issue_date, due_date, 
      items, notes, tax_rate, discount, subtotal, 
      tax_amount, discount_amount, total_amount 
    } = req.body;
    
    // Generate invoice number
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      "SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE $1",
      [`INV-${yearMonth}%`]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const invoice_number = `INV-${yearMonth}-${String(count).padStart(4, '0')}`;
    
    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number, client_id, project_id, issue_date, due_date,
        subtotal, tax_rate, tax_amount, discount_amount, total_amount,
        notes, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        invoice_number, client_id, project_id || null, invoice_date, due_date,
        subtotal, tax_rate, tax_amount, discount_amount, total_amount,
        notes, 'pending', req.user.id
      ]
    );
    
    const invoice_id = invoiceResult.rows[0].id;
    
    // Insert invoice items
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice_id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      invoice_id,
      invoice_number
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  } finally {
    client.release();
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({
      message: 'Invoice status updated',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice' });
  }
};



exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
exports.sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get invoice and client details
    const result = await pool.query(`
      SELECT i.*, c.name as client_name, c.email as client_email
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const invoice = result.rows[0];
    
    // Here you would implement email sending logic
    // For now, just mark as sent
    await pool.query(
      'UPDATE invoices SET sent_date = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ message: 'Error sending invoice' });
  }
};



    // Get invoice data
    const invoiceResult = await pool.query(`
      SELECT i.*, c.name as client_name, c.email as client_email, 
             c.phone as client_phone, c.address as client_address
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Get invoice items
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [id]
    );
    
    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    
    // Pipe to response
    doc.pipe(res);
    
    // Add content
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(14).text(`Invoice #: ${invoice.invoice_number}`, 50, 80);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 50, 100);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, 120);
    
    // Client details
    doc.text('Bill To:', 50, 160);
    doc.fontSize(12);
    doc.text(invoice.client_name, 50, 180);
    doc.text(invoice.client_address || '', 50, 200);
    doc.text(invoice.client_email || '', 50, 220);
    
    // Items table
    doc.fontSize(12);
    let yPosition = 280;
    doc.text('Description', 50, yPosition);
    doc.text('Qty', 300, yPosition);
    doc.text('Price', 350, yPosition);
    doc.text('Total', 450, yPosition);
    
    yPosition += 20;
    itemsResult.rows.forEach(item => {
      doc.text(item.description, 50, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(`₦${item.unit_price}`, 350, yPosition);
      doc.text(`₦${item.total_price}`, 450, yPosition);
      yPosition += 20;
    });
    
    // Totals
    yPosition += 20;
    doc.text(`Subtotal: ₦${invoice.subtotal}`, 350, yPosition);
    yPosition += 20;
    doc.text(`Tax: ₦${invoice.tax_amount}`, 350, yPosition);
    yPosition += 20;
    doc.text(`Total: ₦${invoice.total_amount}`, 350, yPosition);
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

// Update the payment recording function
exports.recordPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { invoice_id, amount, payment_date, payment_method, reference_number, notes } = req.body;
    
    // Get invoice details
    const invoiceResult = await client.query(
      'SELECT total_amount, amount_paid FROM invoices WHERE id = $1',
      [invoice_id]
    );
    
    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoiceResult.rows[0];
    const newAmountPaid = parseFloat(invoice.amount_paid || 0) + parseFloat(amount);
    
    // Determine new status
    let newStatus = 'pending';
    if (newAmountPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partially_paid';
    }
    
    // Record payment
    await client.query(
      `INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [invoice_id, amount, payment_date, payment_method, reference_number, notes, req.user.id]
    );

// Update invoice
exports.updateInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      issue_date, due_date, items, notes, 
      tax_rate, discount, subtotal, tax_amount, 
      discount_amount, total_amount 
    } = req.body;
    
    // Check if invoice exists and is not paid
    const checkResult = await client.query(
      'SELECT status FROM invoices WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }
    
    if (checkResult.rows[0].status === 'paid') {
      throw new Error('Cannot edit paid invoices');
    }
    
    // Update invoice
    await client.query(
      `UPDATE invoices SET 
        issue_date = $1, due_date = $2, subtotal = $3, 
        tax_rate = $4, tax_amount = $5, discount_amount = $6, 
        total_amount = $7, notes = $8, updated_at = NOW()
      WHERE id = $9`,
      [
        issue_date, due_date, subtotal, tax_rate, 
        tax_amount, discount_amount, total_amount, notes, id
      ]
    );
    
    // Delete old items
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    
    // Insert new items
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Invoice updated successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: error.message || 'Error updating invoice' });
  } finally {
    client.release();
  }
};


// Get expenses
exports.getExpenses = async (req, res) => {
  try {
    const { user } = req;
    const { start_date, end_date, category, status, expense_type } = req.query;
    
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    let query = `
      SELECT 
        e.*,
        p.title as project_title,
        c.name as client_name,
        u.full_name as created_by_name,
        au.full_name as approved_by_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users au ON e.approved_by = au.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    if (!isAdmin) {
      query += ` AND e.created_by = $${paramCount}`;
      queryParams.push(user.id);
      paramCount++;
    }
    
    if (expense_type) {
      query += ` AND e.expense_type = $${paramCount}`;
      queryParams.push(expense_type);
      paramCount++;
    }
    
    // ... rest of the filters ...
    
    query += ' ORDER BY e.expense_date DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
};


// Create expense
exports.createExpense = async (req, res) => {
  console.log('Creating expense:', req.body);
  console.log('User:', req.user);
  
  try {
    const { user } = req;
    const {
      expense_date,
      category,
      vendor,
      description,
      amount,
      payment_method,
      receipt_url,
      project_id,
      client_id,
      department,
      expense_type
    } = req.body;
    
    // Convert empty strings to null for optional fields
    const processedData = {
      project_id: project_id === '' || !project_id ? null : parseInt(project_id),
      client_id: client_id === '' || !client_id ? null : parseInt(client_id),
      department: department || null,
      expense_type: expense_type || 'company'
    };
    
    const result = await pool.query(`
      INSERT INTO expenses (
        expense_date, category, vendor, description, amount,
        payment_method, receipt_url, project_id, client_id,
        department, expense_type, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      expense_date, category, vendor, description, amount,
      payment_method, receipt_url || null, processedData.project_id, 
      processedData.client_id, processedData.department,
      processedData.expense_type, user.id
    ]);
    
    res.status(201).json({
      message: 'Expense recorded successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Error creating expense' });
  }
};


// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const {
      expense_date,
      category,
      vendor,
      description,
      amount,
      payment_method,
      receipt_url,
      project_id,
      client_id,
      department,
      expense_type
    } = req.body;
    
    // Check if user can edit (owner or admin)
    const expenseCheck = await pool.query('SELECT created_by FROM expenses WHERE id = $1', [id]);
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const isOwner = expenseCheck.rows[0].created_by === user.id;
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this expense' });
    }
    
    const result = await pool.query(`
      UPDATE expenses 
      SET expense_date = $1, category = $2, vendor = $3, description = $4,
          amount = $5, payment_method = $6, receipt_url = $7, project_id = $8,
          client_id = $9, department = $10, expense_type = $11, updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      expense_date, category, vendor, description, amount,
      payment_method, receipt_url, project_id || null, client_id || null,
      department, expense_type, id
    ]);
    
    res.json({
      message: 'Expense updated successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
};

// Update expense status (admin only)
exports.updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user } = req;
    
    const isAdmin = user.roles?.includes('admin') || user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const result = await pool.query(
      'UPDATE expenses SET status = $1, approved_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, user.id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({
      message: 'Expense status updated',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({ message: 'Error updating expense status' });
  }
};




// Get financial dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const queryParams = [];
    
    if (start_date && end_date) {
      dateFilter = ' AND issue_date BETWEEN $1 AND $2';
      queryParams.push(start_date, end_date);
    }
    
    // Total revenue (paid invoices)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) as total_revenue 
       FROM invoices WHERE status = 'paid'${dateFilter}`,
      queryParams
    );
    
    // Outstanding amount
    const outstandingResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) as outstanding 
       FROM invoices WHERE status IN ('sent', 'overdue')${dateFilter}`,
      queryParams
    );
    
    // Total expenses
    const expensesResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses 
       FROM expenses WHERE status = 'approved'${dateFilter.replace('issue_date', 'expense_date')}`,
      queryParams
    );
    
    // Recent invoices
    const recentInvoices = await pool.query(`
      SELECT i.*, c.name as client_name 
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);
    
    // Monthly revenue trend
    const monthlyRevenue = await pool.query(`
      SELECT 
        DATE_TRUNC('month', payment_date) as month,
        SUM(amount) as revenue
      FROM payments
      WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month
      ORDER BY month
    `);
    
    res.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      outstandingAmount: parseFloat(outstandingResult.rows[0].outstanding),
      totalExpenses: parseFloat(expensesResult.rows[0].total_expenses),
      profit: parseFloat(revenueResult.rows[0].total_revenue) - parseFloat(expensesResult.rows[0].total_expenses),
      recentInvoices: recentInvoices.rows,
      monthlyRevenue: monthlyRevenue.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

// Get financial settings
exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update financial settings
exports.updateSettings = async (req, res) => {
  try {
    const { user } = req;
    const userRoles = user.roles || [user.role] || [];
    const isAdmin = userRoles.includes('admin') || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      tax_number,
      bank_name,
      bank_account_number,
      bank_account_name,
      invoice_prefix,
      invoice_notes
    } = req.body;
    
    const result = await pool.query(`
      UPDATE financial_settings 
      SET company_name = COALESCE($1, company_name),
          company_address = COALESCE($2, company_address),
          company_phone = COALESCE($3, company_phone),
          company_email = COALESCE($4, company_email),
          tax_number = COALESCE($5, tax_number),
          bank_name = COALESCE($6, bank_name),
          bank_account_number = COALESCE($7, bank_account_number),
          bank_account_name = COALESCE($8, bank_account_name),
          invoice_prefix = COALESCE($9, invoice_prefix),
          invoice_notes = COALESCE($10, invoice_notes),
          updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `, [
      company_name, company_address, company_phone, company_email,
      tax_number, bank_name, bank_account_number, bank_account_name,
      invoice_prefix, invoice_notes
    ]);
    
    res.json({
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};
