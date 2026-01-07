/**
 * Centralized application configuration
 */

export const config = {
  app: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  esewa: {
    // Test mode credentials (always use test mode for now)
    merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    verificationUrl: process.env.ESEWA_VERIFICATION_URL || 'https://rc-epay.esewa.com.np/api/epay/transactions/status',
    testMode: process.env.ESEWA_TEST_MODE !== 'false', // Default to true
  },
};

