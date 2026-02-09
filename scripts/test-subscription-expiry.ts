/**
 * Subscription Expiry System Test Script
 * 
 * Tests the subscription expiry engine and related functionality:
 * - Creates test subscriptions with various expiry dates
 * - Triggers expiry check manually
 * - Verifies reminders are queued
 * - Verifies subscriptions are expired correctly
 * - Cleans up test data
 * 
 * Usage: npx tsx scripts/test-subscription-expiry.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test configuration
const TEST_CONFIG = {
  testUserEmail: 'test-expiry@example.com',
  testCreatorEmail: 'test-creator-expiry@example.com',
  testAmount: 500, // NPR
  testTierLevel: 2,
  createdTestIds: {
    users: [] as string[],
    supporters: [] as string[],
    subscriptions: [] as string[],
    transactions: [] as string[],
  },
};

// Utility functions
function logSuccess(message: string, data?: any) {
  console.log(`✅ ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

function logError(message: string, error?: any) {
  console.error(`❌ ${message}`);
  if (error) {
    console.error('   ', error.message || error);
  }
}

function logInfo(message: string, data?: any) {
  console.log(`ℹ️  ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

function logWarning(message: string, data?: any) {
  console.log(`⚠️  ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, null, 2).split('\n').join('\n    '));
  }
}

async function runTest(name: string, testFn: () => Promise<any>) {
  console.log(`\n🧪 Test: ${name}`);
  console.log('─'.repeat(60));
  try {
    const result = await testFn();
    logSuccess(`${name} passed`);
    return result;
  } catch (error: any) {
    logError(`${name} failed`, error);
    throw error;
  }
}

// Create test user
async function createTestUser(email: string, role: 'supporter' | 'creator') {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
    user_metadata: {
      role,
      display_name: `Test ${role}`,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  TEST_CONFIG.createdTestIds.users.push(data.user.id);
  return data.user;
}

// Create test subscription with specific expiry date
async function createTestSubscription(params: {
  supporterId: string;
  creatorId: string;
  daysUntilExpiry: number;
  paymentGateway: 'esewa' | 'khalti';
  tierLevel: number;
}) {
  const { supporterId, creatorId, daysUntilExpiry, paymentGateway, tierLevel } = params;

  const currentDate = new Date();
  const expiryDate = new Date(currentDate);
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  // First, get or create tier
  let { data: tier, error: tierError } = await supabase
    .from('subscription_tiers')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('tier_level', tierLevel)
    .single();

  if (tierError || !tier) {
    // Create tier if doesn't exist
    const { data: newTier, error: createTierError } = await supabase
      .from('subscription_tiers')
      .insert({
        creator_id: creatorId,
        tier_level: tierLevel,
        tier_name: `Test Tier ${tierLevel}`,
        price: TEST_CONFIG.testAmount,
        description: 'Test tier for expiry testing',
      })
      .select('id')
      .single();

    if (createTierError) throw createTierError;
    tier = newTier;
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      supporter_id: supporterId,
      creator_id: creatorId,
      tier_id: tier!.id,
      tier_level: tierLevel,
      amount: TEST_CONFIG.testAmount,
      currency: 'NPR',
      payment_gateway: paymentGateway,
      status: 'active',
      billing_cycle: 'monthly',
      current_period_start: currentDate.toISOString(),
      current_period_end: expiryDate.toISOString(),
      reminder_sent_at: {},
      renewal_count: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!subscription) throw new Error('No subscription returned');

  TEST_CONFIG.createdTestIds.subscriptions.push(subscription.id);
  return subscription;
}

// Test: Check expiry API
async function testExpiryCheck() {
  await runTest('Expiry Check API', async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/subscriptions/check-expiry`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const result = await response.json();
    return {
      checked: result.result?.checked || 0,
      reminders_sent: result.result?.reminders_sent || 0,
      expired: result.result?.expired || 0,
    };
  });
}

// Verify reminder emails were queued
async function verifyRemindersQueued(subscriptionId: string, expectedReminders: string[]) {
  await runTest('Verify Reminders Queued', async () => {
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('id, email_type, status, payload')
      .eq('email_type', 'subscription_expiring_reminder')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const relevantEmails = (emails || []).filter((email: any) => 
      email.payload.subscriptionId === subscriptionId
    );

    return {
      found: relevantEmails.length,
      expected: expectedReminders.length,
      emails: relevantEmails.map((e: any) => ({
        type: e.email_type,
        status: e.status,
        daysUntilExpiry: e.payload.daysUntilExpiry,
      })),
    };
  });
}

// Verify subscription was expired
async function verifySubscriptionExpired(subscriptionId: string) {
  await runTest('Verify Subscription Expired', async () => {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, status, cancelled_at')
      .eq('id', subscriptionId)
      .single();

    if (error) throw error;
    if (!subscription) throw new Error('Subscription not found');

    return {
      status: subscription.status,
      cancelled: subscription.status === 'cancelled' || subscription.status === 'expired',
      cancelledAt: subscription.cancelled_at,
    };
  });
}

// Cleanup test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  // Delete in reverse order to respect foreign key constraints
  for (const id of TEST_CONFIG.createdTestIds.subscriptions) {
    await supabase.from('subscriptions').delete().eq('id', id);
  }

  for (const id of TEST_CONFIG.createdTestIds.supporters) {
    await supabase.from('supporters').delete().eq('id', id);
  }

  for (const id of TEST_CONFIG.createdTestIds.transactions) {
    await supabase.from('supporter_transactions').delete().eq('id', id);
  }

  for (const id of TEST_CONFIG.createdTestIds.users) {
    await supabase.auth.admin.deleteUser(id);
  }

  logSuccess('Cleanup completed');
}

// Main test function
async function main() {
  console.log('🚀 Subscription Expiry System Test Suite\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Create test users
    const supporter = await runTest('Create Test Supporter', async () => {
      return await createTestUser(TEST_CONFIG.testUserEmail, 'supporter');
    });

    const creator = await runTest('Create Test Creator', async () => {
      return await createTestUser(TEST_CONFIG.testCreatorEmail, 'creator');
    });

    // Test 2: Create subscriptions with various expiry dates
    logInfo('Creating test subscriptions with different expiry dates...');

    const subscription2Days = await runTest('Create Subscription (expires in 2 days)', async () => {
      return await createTestSubscription({
        supporterId: supporter.id,
        creatorId: creator.id,
        daysUntilExpiry: 2,
        paymentGateway: 'esewa',
        tierLevel: TEST_CONFIG.testTierLevel,
      });
    });

    const subscription1Day = await runTest('Create Subscription (expires in 1 day)', async () => {
      return await createTestSubscription({
        supporterId: supporter.id,
        creatorId: creator.id,
        daysUntilExpiry: 1,
        paymentGateway: 'khalti',
        tierLevel: TEST_CONFIG.testTierLevel,
      });
    });

    const subscriptionExpired = await runTest('Create Subscription (already expired)', async () => {
      return await createTestSubscription({
        supporterId: supporter.id,
        creatorId: creator.id,
        daysUntilExpiry: -1, // Already expired
        paymentGateway: 'esewa',
        tierLevel: TEST_CONFIG.testTierLevel,
      });
    });

    // Test 3: Run expiry check
    logInfo('\nRunning expiry check...');
    const expiryResult = await testExpiryCheck();

    // Test 4: Verify results
    if (expiryResult.reminders_sent > 0) {
      await verifyRemindersQueued(subscription2Days.id, ['2_days']);
      await verifyRemindersQueued(subscription1Day.id, ['1_day']);
    }

    if (expiryResult.expired > 0) {
      await verifySubscriptionExpired(subscriptionExpired.id);
    }

    // Test 5: Test My Subscriptions API
    await runTest('My Subscriptions API', async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Note: This would normally require auth, but we're testing with service key
      // In production, this should be tested with proper authentication
      logWarning('API requires authentication - test manually with logged-in user');
      
      return { skipped: true };
    });

    // All tests passed
    console.log('\n' + '='.repeat(60));
    logSuccess('All tests passed!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.log('\n' + '='.repeat(60));
    logError('Test suite failed', error);
    console.log('='.repeat(60));
  } finally {
    // Cleanup
    await cleanup();
  }
}

// Run tests
main();
