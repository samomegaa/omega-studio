const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const pool = require('../config/db');


// Get all studios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM studios ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching studios:', error);
    res.status(500).json({ message: 'Error fetching studios' });
  }
});


// Update studio (admin only)
router.put('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { 
      name, type, description, capacity,
      pricing_type, pricing_structure, features,
      hourly_rate, promo_rate, promo_active, promo_text 
    } = req.body;
    
    // Convert empty strings to null for ALL numeric fields
    const numericHourlyRate = hourly_rate === '' || hourly_rate === undefined ? null : hourly_rate;
    const numericPromoRate = promo_rate === '' || promo_rate === undefined ? null : promo_rate;
    const numericCapacity = capacity === '' || capacity === undefined ? 1 : parseInt(capacity) || 1;
    
    // Ensure pricing_structure and features are valid JSON
    const jsonPricingStructure = pricing_structure ? JSON.stringify(pricing_structure) : '{}';
    const jsonFeatures = features ? JSON.stringify(features) : '[]';
    
    const result = await pool.query(
      `UPDATE studios 
       SET name = $1, type = $2, description = $3, capacity = $4,
           pricing_type = $5, pricing_structure = $6::jsonb, features = $7::jsonb,
           hourly_rate = $8, promo_rate = $9, promo_active = $10, 
           promo_text = $11, updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [
        name || '', 
        type || '', 
        description || '', 
        numericCapacity,
        pricing_type || 'hourly', 
        jsonPricingStructure,
        jsonFeatures,
        numericHourlyRate,
        numericPromoRate,
        promo_active || false, 
        promo_text || '',
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Studio not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating studio:', error);
    res.status(500).json({ message: 'Failed to update studio', error: error.message });
  }
});



module.exports = router;
