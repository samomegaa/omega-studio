const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Departments route under construction' });
});

module.exports = router;
