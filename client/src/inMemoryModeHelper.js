// This script is loaded in the Android app to enable in-memory mode
// and provide default users and rooms

(function() {
  // Force in-memory storage mode
  localStorage.setItem('USE_MEMORY_STORAGE', 'true');
  console.log('In-memory storage mode enabled');
  
  // Set up default credentials (these will be used for display in the login form)
  localStorage.setItem('ADMIN_USERNAME', 'admin');
  localStorage.setItem('ADMIN_PASSWORD', 'admin123');
  localStorage.setItem('USER_USERNAME', 'user');
  localStorage.setItem('USER_PASSWORD', 'User@123');
  
  // You can add more configuration here if needed
  localStorage.setItem('APP_MODE', 'standalone');
  localStorage.setItem('APP_VERSION', '1.0.0');
  
  console.log('Default credentials configured');
})();