// Network Configuration
// Auto-detects environment and uses appropriate backend URL

const API_CONFIG = {
  // Development - Local backend
  dev: {
    baseURL: 'http://localhost:3000',
    socketURL: 'http://localhost:3000'
  },
  
  // Production - Render deployment
  prod: {
    // Replace with your Render URL after deployment
    baseURL: 'https://YOUR-SERVICE-NAME.onrender.com',
    socketURL: 'https://YOUR-SERVICE-NAME.onrender.com'
  }
};

// Auto-detect environment
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '';

// Export appropriate configuration
export const API_URL = isDevelopment 
  ? API_CONFIG.dev.socketURL 
  : API_CONFIG.prod.socketURL;

export const BASE_URL = isDevelopment 
  ? API_CONFIG.dev.baseURL 
  : API_CONFIG.prod.baseURL;

// Connection status
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

console.log(`🌐 Network Config: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`📡 Backend URL: ${API_URL}`);
