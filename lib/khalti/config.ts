/**
 * Khalti Payment Gateway Configuration
 * Based on: https://medium.com/@paudelronish/integrating-esewa-and-khalti-payment-gateways-in-next-js-14-with-server-actions-f15729ffae3e
 */

const isProduction = process.env.NODE_ENV === 'production';

// Test credentials
// Note: You MUST register at https://test-admin.khalti.com to get valid test keys
// The keys below are placeholders - get real test keys from Khalti dashboard
const TEST_CONFIG = {
  publicKey: 'test_public_key_your_key_here',
  secretKey: 'test_secret_key_your_key_here',
};

export const khaltiConfig = {
  // Public key (used in frontend)
  publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY || TEST_CONFIG.publicKey,
  
  // Secret key (used in backend only)
  secretKey: process.env.KHALTI_SECRET_KEY || TEST_CONFIG.secretKey,
  
  // API URLs
  paymentUrl: isProduction
    ? 'https://khalti.com/api/v2/epayment/initiate/'
    : 'https://a.khalti.com/api/v2/epayment/initiate/',
    
  verificationUrl: isProduction
    ? 'https://khalti.com/api/v2/epayment/lookup/'
    : 'https://a.khalti.com/api/v2/epayment/lookup/',
  
  // Callback URLs
  returnUrl: process.env.KHALTI_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/khalti/verify`,
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Settings
  isProduction,
  testMode: !isProduction,
  timeout: 300000, // 5 minutes
  currency: 'NPR',
};

export default khaltiConfig;
