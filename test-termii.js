require('dotenv').config();
const termii = require('./config/termii');

async function test() {
  // Check balance
  const balance = await termii.getBalance();
  console.log('Termii Balance:', balance);
  
  // Test SMS (replace with your number)
  // const result = await termii.sendSMS('08012345678', 'Test message from Omega Studio');
  // console.log('SMS Result:', result);
}

test();
