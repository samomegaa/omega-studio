const fs = require('fs');
const path = require('path');

const BLOCKED_IPS_FILE = path.join(__dirname, '../blocked_ips.json');
const SCAN_THRESHOLD = 10; // Block after 10 suspicious requests
const scanAttempts = new Map();

// Load blocked IPs
let blockedIPs = new Set();
try {
  if (fs.existsSync(BLOCKED_IPS_FILE)) {
    const data = JSON.parse(fs.readFileSync(BLOCKED_IPS_FILE, 'utf8'));
    blockedIPs = new Set(data);
  }
} catch (error) {
  console.error('Error loading blocked IPs:', error);
}

// Save blocked IPs
const saveBlockedIPs = () => {
  try {
    fs.writeFileSync(BLOCKED_IPS_FILE, JSON.stringify([...blockedIPs]));
  } catch (error) {
    console.error('Error saving blocked IPs:', error);
  }
};

// Track scan attempts
exports.trackScanAttempt = (ip) => {
  const attempts = scanAttempts.get(ip) || 0;
  scanAttempts.set(ip, attempts + 1);
  
  if (attempts + 1 >= SCAN_THRESHOLD) {
    blockedIPs.add(ip);
    saveBlockedIPs();
    console.log(`Blocked IP ${ip} after ${SCAN_THRESHOLD} scan attempts`);
  }
};

// Check if IP is blocked
exports.isBlocked = (ip) => {
  return blockedIPs.has(ip);
};

// Middleware to block IPs
exports.blockIPMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (exports.isBlocked(ip)) {
    console.log(`Blocked request from banned IP: ${ip}`);
    return res.status(403).send('Forbidden');
  }
  
  next();
};
