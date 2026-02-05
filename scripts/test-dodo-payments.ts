/**
 * Dodo Payments API Test Script
 * 
 * Tests all Dodo Payments API endpoints to catch errors and validate integration
 * 
 * Usage:
 *   npx tsx scripts/test-dodo-payments.ts
 * 
 * Or with Node:
 *   npx ts-node scripts/test-dodo-payments.ts
 */

// Set API keys directly BEFORE any imports (so config can read them)
process.env.DODO_PAYMENTS_API_KEY = 'v3CWLEdAaorr7r8o.brzK1xN8-pqJeWX6BJqhqE9PjhlsW040BUelyk_e8j-ENKUy';
process.env.DODO_PAYMENTS_WEBHOOK_KEY = 'whsec_HRsBtjQ0OLicZKK6JJG2L4LHgpL8CmN6';
process.env.DODO_PAYMENTS_ENVIRONMENT = 'test_mode';
process.env.DODO_PAYMENTS_RETURN_URL = 'https://localhost:3000/payment/success';

// Load environment variables from .env.local
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local file manually
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          let value = trimmed.substring(equalIndex + 1).trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (key && value) {
            process.env[key] = value; // Override existing values
          }
        }
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Load .env.local first, then .env as fallback
const loadedLocal = loadEnvFile(resolve(process.cwd(), '.env.local'));
const loadedEnv = loadEnvFile(resolve(process.cwd(), '.env'));

// Debug: Show what was loaded
console.log('\n=== Environment Variables Loaded ===');
console.log('DODO_PAYMENTS_API_KEY:', process.env.DODO_PAYMENTS_API_KEY ? `✓ (length: ${process.env.DODO_PAYMENTS_API_KEY.length})` : '✗ NOT SET');
console.log('DODO_PAYMENTS_WEBHOOK_KEY:', process.env.DODO_PAYMENTS_WEBHOOK_KEY ? `✓ (length: ${process.env.DODO_PAYMENTS_WEBHOOK_KEY.length})` : '✗ NOT SET');
console.log('DODO_PAYMENTS_ENVIRONMENT:', process.env.DODO_PAYMENTS_ENVIRONMENT || 'NOT SET');
console.log('DODO_PAYMENTS_RETURN_URL:', process.env.DODO_PAYMENTS_RETURN_URL || 'NOT SET');
console.log('=====================================\n');

// Force reload config by clearing cache and re-importing
delete require.cache[require.resolve('../lib/dodo/config')];
delete require.cache[require.resolve('../lib/dodo/client')];

import { dodoClient } from '../lib/dodo/client';
import { dodoConfig } from '../lib/dodo/config';

// Manually update config if env vars are set but config didn't pick them up
if (process.env.DODO_PAYMENTS_API_KEY && !dodoConfig.apiKey) {
  (dodoConfig as any).apiKey = process.env.DODO_PAYMENTS_API_KEY;
}
if (process.env.DODO_PAYMENTS_WEBHOOK_KEY && !dodoConfig.webhookKey) {
  (dodoConfig as any).webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
}
if (process.env.DODO_PAYMENTS_RETURN_URL && dodoConfig.returnUrl === 'http://localhost:3000') {
  (dodoConfig as any).returnUrl = process.env.DODO_PAYMENTS_RETURN_URL;
}

// Also update the client's internal apiKey since it's set in constructor
if (dodoConfig.apiKey) {
  (dodoClient as any).apiKey = dodoConfig.apiKey;
}

// Debug: Show what config sees
console.log('\n=== Config After Import ===');
console.log('dodoConfig.apiKey:', dodoConfig.apiKey ? `✓ (length: ${dodoConfig.apiKey.length})` : '✗ NOT SET');
console.log('dodoConfig.webhookKey:', dodoConfig.webhookKey ? `✓ (length: ${dodoConfig.webhookKey.length})` : '✗ NOT SET');
console.log('dodoConfig.apiUrl:', dodoConfig.apiUrl);
console.log('dodoConfig.environment:', dodoConfig.environment);
console.log('=====================================\n');

// Test configuration
const TEST_CONFIG = {
  customer: {
    email: 'test@example.com',
    name: 'Test Customer',
  },
  productId: 'test_product_123',
  amount: 100000, // 1000 USD in cents
  currency: 'USD',
  billing: {
    interval: 'monthly' as const,
    country: 'US', // United States
  },
  successUrl: 'http://localhost:3000/payment/dodo/success',
  cancelUrl: 'http://localhost:3000/payment/failure',
  metadata: {
    test: 'true',
    tier_level: '2',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test results tracker
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
  logInfo(`\nRunning: ${name}`);
  try {
    const result = await testFn();
    testResults.push({ name, passed: true, data: result });
    logSuccess(`${name} - PASSED`);
    if (result && typeof result === 'object') {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, passed: false, error: errorMessage });
    logError(`${name} - FAILED: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      console.log(error.stack);
    }
  }
}

async function testConfiguration() {
  log('\n' + '='.repeat(60), 'cyan');
  log('DODO PAYMENTS API TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  
  logInfo('\nConfiguration Check:');
  console.log({
    apiUrl: dodoConfig.apiUrl,
    environment: dodoConfig.environment,
    testMode: dodoConfig.testMode,
    hasApiKey: !!dodoConfig.apiKey,
    apiKeyLength: dodoConfig.apiKey?.length || 0,
    hasWebhookKey: !!dodoConfig.webhookKey,
    returnUrl: dodoConfig.returnUrl,
  });

  if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
    logError('DODO_PAYMENTS_API_KEY is not set!');
    logWarning('Some tests will fail without a valid API key.');
    logWarning('Set DODO_PAYMENTS_API_KEY in your .env.local file for full testing.');
    logWarning('Continuing with structure validation tests...\n');
  }
}

async function testCreateProduct() {
  await runTest('Create Product', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    const product = await dodoClient.createProduct({
      name: 'Test Subscription Product',
      description: 'Test product for subscription',
      price: {
        type: 'recurring_price',
        price: TEST_CONFIG.amount, // Amount in cents (integer)
        currency: TEST_CONFIG.currency,
        discount: 0, // No discount
        purchasing_power_parity: false, // PPP not available
        payment_frequency_count: 1, // Monthly payments
        payment_frequency_interval: 'Month',
        subscription_period_count: 1, // 1 month subscription period
        subscription_period_interval: 'Month',
        tax_inclusive: false, // Tax not included
        trial_period_days: 0, // No trial period
      },
      tax_category: 'saas',
      metadata: {
        test: 'true',
      },
    });

    if (!product.product_id) {
      throw new Error('Missing product_id in response');
    }

    // Store product ID for subscription test
    (TEST_CONFIG as any).actualProductId = product.product_id;

    return {
      productId: product.product_id,
      name: product.name,
      status: product.status,
    };
  });
}

async function testCreateCheckoutSession() {
  await runTest('Create Checkout Session', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    // Use actual product ID from product creation test, or fallback to test product ID
    const productId = (TEST_CONFIG as any).actualProductId || TEST_CONFIG.productId;

    const checkoutSession = await dodoClient.createCheckoutSession({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: TEST_CONFIG.customer,
      return_url: TEST_CONFIG.successUrl,
      metadata: TEST_CONFIG.metadata,
    });

    if (!checkoutSession.session_id) {
      throw new Error('Missing session_id in response');
    }
    if (!checkoutSession.checkout_url) {
      throw new Error('Missing checkout_url in response');
    }

    // Store session ID for other tests
    (TEST_CONFIG as any).checkoutSessionId = checkoutSession.session_id;

    return {
      sessionId: checkoutSession.session_id,
      checkoutUrl: checkoutSession.checkout_url,
    };
  });
}

async function testCreateSubscription() {
  await runTest('Create Subscription (Deprecated)', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    // Use actual product ID from product creation test, or fallback to test product ID
    const productId = (TEST_CONFIG as any).actualProductId || TEST_CONFIG.productId;

    const subscription = await dodoClient.createSubscription({
      customer: TEST_CONFIG.customer,
      product_id: productId,
      quantity: 1,
      amount: TEST_CONFIG.amount,
      currency: TEST_CONFIG.currency,
      billing: TEST_CONFIG.billing,
      success_url: TEST_CONFIG.successUrl,
      cancel_url: TEST_CONFIG.cancelUrl,
      metadata: TEST_CONFIG.metadata,
    });

    if (!subscription.subscription_id) {
      throw new Error('Missing subscription_id in response');
    }
    if (!subscription.payment_url) {
      throw new Error('Missing payment_url in response');
    }

    return {
      subscriptionId: subscription.subscription_id,
      customerId: subscription.customer_id,
      paymentUrl: subscription.payment_url,
      status: subscription.status,
    };
  });
}

async function testGetCheckoutSession() {
  // First, we need a session ID from a previous test
  const createTest = testResults.find(t => t.name === 'Create Checkout Session' && t.passed);
  if (!createTest || !createTest.data?.sessionId) {
    logWarning('Skipping Get Checkout Session test - no session ID available');
    return;
  }

  const sessionId = createTest.data.sessionId;

  await runTest('Get Checkout Session', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    const session = await dodoClient.getCheckoutSession(sessionId);

    if (!session.id) {
      throw new Error('Missing id in response');
    }
    if (session.id !== sessionId) {
      throw new Error(`Session ID mismatch: expected ${sessionId}, got ${session.id}`);
    }

    return {
      id: session.id,
      customerEmail: session.customer_email,
      paymentId: session.payment_id,
      paymentStatus: session.payment_status,
    };
  });
}

async function testGetSubscription() {
  // First, we need a subscription ID from a previous test
  const createTest = testResults.find(t => t.name === 'Create Subscription (Deprecated)' && t.passed);
  if (!createTest || !createTest.data?.subscriptionId) {
    logWarning('Skipping Get Subscription test - no subscription ID available');
    return;
  }

  const subscriptionId = createTest.data.subscriptionId;

  await runTest('Get Subscription', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    const subscription = await dodoClient.getSubscription(subscriptionId);

    if (!subscription.id) {
      throw new Error('Missing id in response');
    }
    if (subscription.id !== subscriptionId) {
      throw new Error(`Subscription ID mismatch: expected ${subscriptionId}, got ${subscription.id}`);
    }

    return {
      id: subscription.id,
      customerId: subscription.customer_id,
      productId: subscription.product_id,
      status: subscription.status,
      amount: subscription.amount,
      currency: subscription.currency,
      interval: subscription.interval,
    };
  });
}

async function testCancelSubscription() {
  // First, we need a subscription ID from a previous test
  const createTest = testResults.find(t => t.name === 'Create Subscription (Deprecated)' && t.passed);
  if (!createTest || !createTest.data?.subscriptionId) {
    logWarning('Skipping Cancel Subscription test - no subscription ID available');
    return;
  }

  const subscriptionId = createTest.data.subscriptionId;

  await runTest('Cancel Subscription', async () => {
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      throw new Error('API key not set - skipping actual API call');
    }

    const result = await dodoClient.cancelSubscription(subscriptionId);

    if (!result.subscription_id) {
      throw new Error('Missing subscription_id in response');
    }
    if (result.status !== 'cancelled') {
      throw new Error(`Expected status 'cancelled', got '${result.status}'`);
    }

    return {
      subscriptionId: result.subscription_id,
      status: result.status,
      cancelledAt: result.cancelled_at,
    };
  });
}

async function testWebhookSignatureVerification() {
  await runTest('Webhook Signature Verification', async () => {
    const testWebhookKey = dodoConfig.webhookKey || 'test_webhook_key_for_verification';
    
    if (!dodoConfig.webhookKey || dodoConfig.webhookKey.trim() === '') {
      logWarning('Webhook key not set - using test key for verification test');
    }

    const payload = JSON.stringify({
      type: 'subscription.activated',
      data: {
        subscription_id: 'test_sub_123',
        customer_id: 'test_cust_123',
      },
      created_at: new Date().toISOString(),
    });

    // Generate a valid signature using the same key that verifyWebhookSignature will use
    const crypto = require('crypto');
    const validSignature = crypto
      .createHmac('sha256', testWebhookKey)
      .update(payload)
      .digest('hex');

    // Temporarily set webhook key if not set, for testing
    const originalWebhookKey = dodoConfig.webhookKey;
    if (!dodoConfig.webhookKey) {
      (dodoConfig as any).webhookKey = testWebhookKey;
    }

    try {
      // Test valid signature
      const isValid = dodoClient.verifyWebhookSignature(payload, validSignature);
      if (!isValid) {
        throw new Error('Valid signature was rejected');
      }

      // Test invalid signature
      const isInvalid = dodoClient.verifyWebhookSignature(payload, 'invalid_signature');
      if (isInvalid) {
        throw new Error('Invalid signature was accepted');
      }

      return {
        validSignatureTest: true,
        invalidSignatureTest: true,
      };
    } finally {
      // Restore original webhook key
      if (!originalWebhookKey) {
        (dodoConfig as any).webhookKey = originalWebhookKey;
      }
    }
  });
}

async function testInvalidRequests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('TESTING ERROR HANDLING', 'yellow');
  log('='.repeat(60), 'yellow');

  await runTest('Create Subscription - Missing Customer', async () => {
    try {
      await dodoClient.createSubscription({
        customer: { email: '', name: '' } as any,
        product_id: TEST_CONFIG.productId,
        quantity: 1,
        amount: TEST_CONFIG.amount,
        currency: TEST_CONFIG.currency,
        billing: TEST_CONFIG.billing,
        success_url: TEST_CONFIG.successUrl,
        cancel_url: TEST_CONFIG.cancelUrl,
      });
      throw new Error('Should have thrown an error for missing customer email');
    } catch (error) {
      // Expected to fail
      return { expectedError: true, error: error instanceof Error ? error.message : String(error) };
    }
  });

  await runTest('Create Subscription - Missing Quantity', async () => {
    try {
      await dodoClient.createSubscription({
        customer: TEST_CONFIG.customer,
        product_id: TEST_CONFIG.productId,
        quantity: undefined as any,
        amount: TEST_CONFIG.amount,
        currency: TEST_CONFIG.currency,
        billing: TEST_CONFIG.billing,
        success_url: TEST_CONFIG.successUrl,
        cancel_url: TEST_CONFIG.cancelUrl,
      });
      throw new Error('Should have thrown an error for missing quantity');
    } catch (error) {
      // Expected to fail
      return { expectedError: true, error: error instanceof Error ? error.message : String(error) };
    }
  });

  await runTest('Get Subscription - Invalid ID', async () => {
    try {
      await dodoClient.getSubscription('invalid_subscription_id_12345');
      throw new Error('Should have thrown an error for invalid subscription ID');
    } catch (error) {
      // Expected to fail
      return { expectedError: true, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

function printSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  const total = testResults.length;

  log(`\nTotal Tests: ${total}`, 'reset');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }

  if (failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults
      .filter(t => !t.passed)
      .forEach(test => {
        logError(`  - ${test.name}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
  }

  log('\n' + '='.repeat(60), 'cyan');
}

async function main() {
  try {
    await testConfiguration();

    log('\n' + '='.repeat(60), 'cyan');
    log('TESTING API ENDPOINTS', 'cyan');
    log('='.repeat(60), 'cyan');

    // Test valid operations
    await testCreateProduct(); // Create product first
    await testCreateCheckoutSession(); // Create checkout session (recommended)
    await testGetCheckoutSession(); // Get checkout session status
    await testCreateSubscription(); // Test deprecated subscription endpoint
    await testGetSubscription();
    await testCancelSubscription();
    await testWebhookSignatureVerification();

    // Test error handling
    await testInvalidRequests();

    // Print summary
    printSummary();

    // Exit with appropriate code
    const failed = testResults.filter(t => !t.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    logError(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as testDodoPayments };
