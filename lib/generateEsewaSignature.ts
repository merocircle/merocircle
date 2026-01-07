import * as crypto from 'crypto';

/**
 * Generate eSewa payment signature
 * @param secretKey - eSewa merchant secret key
 * @param dataString - String to sign (format: "key1=value1,key2=value2")
 * @returns Base64 encoded HMAC-SHA256 signature
 */
export function generateEsewaSignature(secretKey: string, dataString: string): string {
  try {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dataString);
    return hmac.digest('base64');
  } catch (error) {
    throw new Error(`Failed to generate eSewa signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

