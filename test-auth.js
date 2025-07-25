console.log('Testing authController...');
try {
  const authController = require('./controllers/authController');
  console.log('Success! Functions:', Object.keys(authController));
  
  // Test if functions are actually functions
  console.log('login is function?', typeof authController.login === 'function');
  console.log('register is function?', typeof authController.register === 'function');
} catch (error) {
  console.error('Failed to load authController:', error);
}
