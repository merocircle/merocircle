export const config = {
  app: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://creators-nepal.vercel.app'),
  },
  esewa: {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    verificationUrl: process.env.ESEWA_VERIFICATION_URL || 'https://rc-epay.esewa.com.np/api/epay/transactions/status',
    testMode: process.env.ESEWA_TEST_MODE !== 'false',
  },
  upload: {
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};

