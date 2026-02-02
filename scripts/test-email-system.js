#!/usr/bin/env node

/**
 * Email System Test Script
 * 
 * Usage:
 *   node scripts/test-email-system.js
 * 
 * Tests:
 * 1. Email queue health
 * 2. Process queue manually
 * 3. Send test welcome email
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const cronSecret = process.env.CRON_SECRET;

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');
  
  try {
    // Test 1: Check queue health
    console.log('📊 1. Checking email queue health...');
    const healthResponse = await fetch(`${baseUrl}/api/email/stats`);
    const healthData = await healthResponse.json();
    
    console.log(`   Status: ${healthData.health?.status || 'unknown'}`);
    console.log(`   Success Rate: ${healthData.health?.score || 0}%`);
    console.log(`   Pending: ${healthData.stats?.pending || 0}`);
    console.log(`   Sent (24h): ${healthData.stats?.sent || 0}`);
    console.log(`   Failed (24h): ${healthData.stats?.failed || 0}`);
    
    if (healthData.health?.issues?.length > 0) {
      console.log(`   ⚠️  Issues: ${healthData.health.issues.join(', ')}`);
    }
    console.log();
    
    // Test 2: Process queue
    console.log('⚙️  2. Processing email queue...');
    const processResponse = await fetch(`${baseUrl}/api/email/process-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });
    
    const processData = await processResponse.json();
    
    if (processResponse.ok) {
      console.log(`   ✅ Processed: ${processData.processed || 0}`);
      console.log(`   📧 Sent: ${processData.sent || 0}`);
      console.log(`   ❌ Failed: ${processData.failed || 0}`);
      console.log(`   ⏱️  Duration: ${processData.duration || 0}ms`);
    } else {
      console.log(`   ❌ Error: ${processData.error || 'Unknown error'}`);
    }
    console.log();
    
    // Test 3: Optional - send test welcome email
    const testEmail = process.argv[2]; // node scripts/test-email-system.js test@example.com
    
    if (testEmail) {
      console.log(`📧 3. Sending test welcome email to ${testEmail}...`);
      const welcomeResponse = await fetch(`${baseUrl}/api/email/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const welcomeData = await welcomeResponse.json();
      
      if (welcomeResponse.ok) {
        console.log(`   ✅ ${welcomeData.message}`);
        console.log(`   Queue ID: ${welcomeData.queueId}`);
      } else {
        console.log(`   ❌ Error: ${welcomeData.error || 'Unknown error'}`);
      }
      console.log();
    }
    
    console.log('✅ Email system test complete!\n');
    
    // Summary
    if (healthData.health?.status === 'healthy' && processData.failed === 0) {
      console.log('🎉 All systems operational!\n');
    } else {
      console.log('⚠️  Some issues detected. Check logs for details.\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testEmailSystem();
