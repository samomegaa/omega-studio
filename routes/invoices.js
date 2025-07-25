const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Invoices route under construction' });
});

module.exports = router;
