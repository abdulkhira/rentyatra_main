// API Configuration
const DEFAULT_PROD_API = 'https://api.rentyatra.com/api';

const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : DEFAULT_PROD_API),
  // You can add more configuration here
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

export default config;
