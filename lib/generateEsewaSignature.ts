import crypto from 'crypto';

/**
 * Generate eSewa HMAC-SHA256 signature
 * Following Medium article: https://medium.com/@mukesh.adhykari/integrating-esewa-payment-gateway-in-next-js-a-complete-guide-by-mukesh-adhikari-da2efbe3c7ef
 * 
 * @param secretKey - eSewa secret key (test: 8gBm/:&EnhH.1/q)
 * @param message - Signature message (format: total_amount=X,transaction_uuid=Y,product_code=Z)
 * @returns Base64 encoded signature
 */
export function generateEsewaSignature(secretKey: string, message: string): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

