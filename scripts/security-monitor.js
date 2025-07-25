const fs = require('fs');
const path = require('path');

// Monitor PM2 logs for security events
const monitorLogs = () => {
  console.log('Security Monitor Started');
  console.log('Watching for suspicious activity...\n');
  
  // Check blocked IPs
  const blockedIPsFile = path.join(__dirname, '../blocked_ips.json');
  if (fs.existsSync(blockedIPsFile)) {
    const blockedIPs = JSON.parse(fs.readFileSync(blockedIPsFile, 'utf8'));
    console.log(`Currently blocked IPs: ${blockedIPs.length}`);
    blockedIPs.forEach(ip => console.log(`  - ${ip}`));
  }
};

monitorLogs();
