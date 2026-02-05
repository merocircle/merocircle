# Dodo Payments Integration Documentation

This document provides comprehensive information about the Dodo Payments integration, including setup instructions, API endpoints, implementation details, and how it works within the unified payment system.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [How It Works](#how-it-works)
6. [Integration with Unified Engines](#integration-with-unified-engines)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Dodo Payments?

Dodo Payments is a payment gateway that provides subscription-based payment processing with support for **Visa/Mastercard** credit and debit cards. It's designed for recurring payments (monthly subscriptions) and offers a hosted checkout experience.

### Key Features

- **Subscription-Based**: Monthly recurring payments
- **Card Support**: Visa and Mastercard
- **Hosted Checkout**: Secure payment page hosted by Dodo
- **Webhook Support**: Real-time payment event notifications
- **Test Mode**: Full testing environment before going live

### Integration Architecture

Dodo Payments is integrated into the unified payment system, using the same payment success and subscription engines as other gateways (eSewa, Khalti, Direct). This ensures consistent behavior across all payment methods.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (User)                          │
│  Selects Dodo Payment → Initiates Subscription              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/payment/dodo/subscription/initiate        │
│  - Fetches NPR→USD exchange rate (ExchangeRate-API)        │
│  - Converts NPR amount to USD                               │
│  - Creates product in Dodo (if needed)                      │
│  - Creates checkout session                                 │
│  - Returns checkout URL                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Dodo Hosted Checkout Page                      │
│  User enters card details → Payment processed               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         GET /api/payment/dodo/subscription/verify           │
│  - Verifies checkout session status                         │
│  - Calls Payment Success Engine                             │
│  - Redirects to success page                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/payment/dodo/webhook                  │
│  - Receives payment events from Dodo                        │
│  - Processes through unified engines                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Create Dodo Payments Account

1. Visit [Dodo Payments](https://dodopayments.com)
2. Sign up for an account
3. Complete business verification
4. Access your dashboard

### 2. Get API Credentials

1. Navigate to **Settings → API Keys** in Dodo dashboard
2. Copy your **API Key** (starts with `v3...`)
3. Copy your **Webhook Secret** (starts with `whsec_...`)
4. Note your **Environment** (Test or Live)

### 3. Configure Environment Variables

Add the following to your `.env.local` (development) or Vercel environment variables (production):

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test_mode  # or 'production' for live
DODO_PAYMENTS_RETURN_URL=http://localhost:3000  # Development (optional, auto-detected)
# DODO_PAYMENTS_RETURN_URL=https://yourdomain.com  # Production (optional, auto-detected)

# Exchange Rate (Optional - defaults to 100 NPR = 1 USD)
# Set this if you want to use a different exchange rate
# Format: NPR per USD (e.g., 100 means 100 NPR = 1 USD)
DODO_PAYMENTS_EXCHANGE_RATE=100
```

**Note**: The `DODO_PAYMENTS_RETURN_URL` is optional. The system automatically detects:
- `http://localhost:3000` for local development
- `https://${VERCEL_URL}` for Vercel deployments
- `NEXT_PUBLIC_APP_URL` if explicitly set

### 4. Configure Webhook URL

1. In Dodo dashboard, go to **Settings → Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payment/dodo/webhook`
3. Select events to receive:
   - `subscription.activated`
   - `payment.succeeded`
   - `subscription.cancelled`
   - `subscription.expired`
   - `payment.failed`

### 5. Database Migration

The database already includes support for Dodo payments. The `supporter_transactions` table accepts `'dodo'` as a valid `payment_method`.

---

## Configuration

### Configuration File

**Location**: `lib/dodo/config.ts`

```typescript
export const dodoConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
  returnUrl: getBaseUrl(), // Auto-detects localhost or Vercel URL
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test',
  apiUrl: getApiUrl(), // test.dodopayments.com or live.dodopayments.com
  testMode: process.env.DODO_PAYMENTS_ENVIRONMENT !== 'production',
};
```

### Exchange Rate Configuration

**Location**: `lib/dodo/exchange-rate.ts`

The system automatically converts NPR (Nepalese Rupees) to USD for Dodo Payments using **ExchangeRate-API** (free tier, no API key required):

- **API**: Uses `https://api.exchangerate-api.com/v4/latest/USD` for real-time rates
- **Caching**: Exchange rates are cached for 1 hour to avoid excessive API calls
- **Fallback**: If API fails, defaults to 100 NPR = 1 USD
- **Configurable**: Set `DODO_PAYMENTS_EXCHANGE_RATE` environment variable to override
- **Storage**: Both NPR and USD amounts are stored in metadata for reference

**Example** (current rate ~144.71 NPR = 1 USD):
- NPR 5,000 → USD ~34.55
- NPR 1,000 → USD ~6.91

The exchange rate is fetched from the API, cached, and logged during product creation for transparency.

### Base URL Detection

The system automatically determines the correct base URL:

1. **DODO_PAYMENTS_RETURN_URL** (if explicitly set)
2. **NEXT_PUBLIC_APP_URL** (custom domain)
3. **VERCEL_URL** (automatically set by Vercel)
4. **Development**: `http://localhost:3000`
5. **Fallback**: `http://localhost:3000`

### API URLs

- **Test Mode**: `https://test.dodopayments.com`
- **Live Mode**: `https://live.dodopayments.com`

---

## API Endpoints

### 1. Initiate Subscription

**Endpoint**: `POST /api/payment/dodo/subscription/initiate`

**Purpose**: Creates a checkout session and returns payment URL

**Request Body**:
```json
{
  "amount": 10.00,
  "creatorId": "uuid",
  "supporterId": "uuid",
  "supporterMessage": "Optional message",
  "tier_level": 2
}
```

**Response**:
```json
{
  "success": true,
  "payment_url": "https://test.checkout.dodopayments.com/session/...",
  "session_id": "cks_...",
  "subscription_id": "uuid"
}
```

**Flow**:
1. Validates payment request
2. Creates/updates subscription record (status: `pending`)
3. Creates transaction record (status: `pending`)
4. Gets or creates Dodo product for the tier
5. Creates Dodo checkout session
6. Returns checkout URL

**File**: `app/api/payment/dodo/subscription/initiate/route.ts`

### 2. Verify Subscription

**Endpoint**: `GET /api/payment/dodo/subscription/verify`

**Purpose**: Verifies subscription status after user returns from checkout

**Query Parameters**:
- `subscription_id`: UUID of subscription record
- `transaction_id`: UUID of transaction record

**Response**:
```json
{
  "success": true,
  "status": "active",
  "subscription": { ... }
}
```

**Flow**:
1. Gets subscription record from database
2. Checks checkout session status via Dodo API
3. If payment succeeded, calls Payment Success Engine
4. Updates subscription status to `active`
5. Returns verification result

**File**: `app/api/payment/dodo/subscription/verify/route.ts`

### 3. Webhook Handler

**Endpoint**: `POST /api/payment/dodo/webhook`

**Purpose**: Receives payment events from Dodo Payments

**Headers**:
- `x-dodo-signature`: HMAC SHA-256 signature for verification

**Event Types Handled**:
- `subscription.activated`: First payment successful
- `payment.succeeded`: Recurring payment successful
- `subscription.cancelled`: Subscription cancelled by user
- `subscription.expired`: Subscription expired
- `payment.failed`: Payment failed

**Flow**:
1. Verifies webhook signature
2. Parses event data
3. Finds subscription record using Dodo subscription ID
4. Processes event through unified engines:
   - Success events → Payment Success Engine
   - Cancellation events → Unsubscribe Engine

**File**: `app/api/payment/dodo/webhook/route.ts`

### 4. Cancel Subscription

**Endpoint**: `POST /api/payment/dodo/subscription/cancel`

**Purpose**: Cancels an active subscription

**Authentication**: Required (user must be authenticated)

**Request Body**:
```json
{
  "subscription_id": "uuid",
  "creator_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

**Flow**:
1. Authenticates user
2. Verifies subscription belongs to user
3. Cancels subscription via Dodo API
4. Updates local database
5. Calls Unsubscribe Engine to clean up

**File**: `app/api/payment/dodo/subscription/cancel/route.ts`

---

## How It Works

### Complete Payment Flow

#### Step 1: User Initiates Payment

```typescript
// Frontend calls initiate endpoint
const response = await fetch('/api/payment/dodo/subscription/initiate', {
  method: 'POST',
  body: JSON.stringify({
    amount: 10.00,
    creatorId: '...',
    supporterId: '...',
    tier_level: 2
  })
});

const { payment_url } = await response.json();
window.location.href = payment_url; // Redirect to Dodo checkout
```

#### Step 2: Product Creation (Automatic)

The system automatically creates products in Dodo if they don't exist:

```typescript
// Product ID format: tier_{tierLevel}_{creatorId}
const productId = `tier_2_${creatorId}`;

// Try to get existing product
try {
  const product = await dodoClient.getProduct(productId);
} catch {
  // Product doesn't exist, create it
  const product = await dodoClient.createProduct({
    name: "Creator's Tier 2 Subscription",
    description: "Monthly subscription for Tier 2 support",
    price: {
      type: 'recurring_price',
      price: 1000, // Amount in cents
      currency: 'USD',
      discount: 0,
      purchasing_power_parity: false,
      payment_frequency_count: 1,
      payment_frequency_interval: 'Month',
      subscription_period_count: 1,
      subscription_period_interval: 'Month',
      tax_inclusive: false,
      trial_period_days: 0
    },
    tax_category: 'saas'
  });
}
```

#### Step 4: Checkout Session Creation

```typescript
const checkoutSession = await dodoClient.createCheckoutSession({
  product_cart: [
    {
      product_id: dodoProductId,
      quantity: 1
    }
  ],
  customer: {
    email: supporter.email,
    name: supporter.display_name
  },
  return_url: `${baseUrl}/payment/success?subscription_id=${subscription.id}&transaction_id=${transaction.id}&gateway=dodo`,
  metadata: {
    subscription_id: subscription.id,
    transaction_id: transaction.id,
    creator_id: creatorId,
    supporter_id: supporterId,
    tier_level: '2'
  }
});
```

#### Step 5: User Completes Payment

User is redirected to Dodo's hosted checkout page where they:
1. Enter card details (Visa/Mastercard)
2. Complete payment
3. Are redirected back to your success page

#### Step 6: Verification

When user returns, the success page calls the verify endpoint:

```typescript
// app/payment/success/page.tsx
if (gateway === 'dodo') {
  const response = await fetch(
    `/api/payment/dodo/subscription/verify?subscription_id=${subscription_id}&transaction_id=${transaction_id}`
  );
  // Process result...
}
```

#### Step 7: Payment Success Engine

The verify endpoint calls the unified Payment Success Engine:

```typescript
await processPaymentSuccess({
  transactionId: transaction.id,
  gatewayData: {
    dodo_checkout_session_id: checkoutSession.session_id,
    dodo_payment_id: checkoutSession.payment_id,
    payment_status: 'succeeded'
  },
  tierLevel: 2
});
```

This engine:
1. Updates transaction status to `completed`
2. Calls Subscription Engine to manage supporter record
3. Updates supporter counts
4. Syncs with Stream Chat channels
5. Sends email notifications

#### Step 8: Webhook Events (Recurring Payments)

For recurring payments, Dodo sends webhook events:

```typescript
// POST /api/payment/dodo/webhook
{
  "type": "payment.succeeded",
  "data": {
    "subscription_id": "sub_...",
    "customer_id": "cus_...",
    "amount": 1000,
    "currency": "USD"
  }
}
```

The webhook handler:
1. Verifies signature
2. Finds subscription record
3. Calls Payment Success Engine
4. Updates subscription period dates

---

## Integration with Unified Engines

### Payment Success Engine

**File**: `lib/payment-success-engine.ts`

Dodo Payments uses the same Payment Success Engine as other gateways:

```typescript
await processPaymentSuccess({
  transactionId: transaction.id,
  gatewayData: {
    // Dodo-specific data
    dodo_checkout_session_id: '...',
    dodo_payment_id: '...',
    payment_status: 'succeeded'
  },
  tierLevel: 2
});
```

**What it does**:
- Updates transaction status
- Calls Subscription Engine
- Updates supporter counts
- Syncs with Stream Chat
- Logs activity

### Subscription Engine

**File**: `lib/subscription-engine.ts`

Manages supporter subscriptions and tier access:

```typescript
await manageSubscription({
  supporterId: '...',
  creatorId: '...',
  tierLevel: 2,
  amount: 10.00,
  paymentGateway: 'dodo',
  subscriptionId: '...'
});
```

**What it does**:
- Creates/updates supporter record
- Manages tier levels
- Adds/removes channel access
- Updates Stream Chat membership
- Sends email notifications

### Unsubscribe Engine

**File**: `lib/unsubscribe-engine.ts`

Handles subscription cancellations:

```typescript
await processUnsubscribe({
  supporterId: '...',
  creatorId: '...',
  cancelSubscription: true,
  removeFromChannels: true,
  reason: 'user_cancelled_dodo'
});
```

**What it does**:
- Cancels subscription in database
- Removes from channels
- Updates Stream Chat
- Sends cancellation emails

---

## Testing

### Test Script

**Location**: `scripts/test-dodo-payments.ts`

Run the test script to verify all API endpoints:

```bash
npx tsx scripts/test-dodo-payments.ts
```

**Tests Included**:
- ✅ Create Product
- ✅ Create Checkout Session
- ✅ Get Checkout Session
- ✅ Webhook Signature Verification
- ✅ Error Handling

### Manual Testing

1. **Initiate Subscription**:
   ```bash
   curl -X POST http://localhost:3000/api/payment/dodo/subscription/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 10.00,
       "creatorId": "...",
       "supporterId": "...",
       "tier_level": 2
     }'
   ```

2. **Verify Subscription**:
   ```bash
   curl "http://localhost:3000/api/payment/dodo/subscription/verify?subscription_id=...&transaction_id=..."
   ```

3. **Test Webhook** (use Dodo dashboard or webhook testing tool)

### Test Cards

Dodo Payments provides test cards for testing:

- **Success**: Use any valid test card number
- **Failure**: Use specific failure test cards (check Dodo docs)
- **3D Secure**: Use cards that trigger 3DS flow

---

## Troubleshooting

### Common Issues

#### 1. SSL Protocol Error

**Error**: `ERR_SSL_PROTOCOL_ERROR` when redirecting

**Solution**: The system automatically converts `https://localhost` to `http://localhost`. Ensure your `DODO_PAYMENTS_RETURN_URL` uses `http://` for localhost.

#### 2. Missing Checkout URL

**Error**: `Checkout URL is null`

**Possible Causes**:
- API key not set correctly
- Product creation failed
- Checkout session creation failed

**Solution**: Check logs for detailed error messages. Verify API key and product creation.

#### 3. Webhook Signature Verification Failed

**Error**: `Invalid Dodo webhook signature`

**Solution**:
- Verify `DODO_PAYMENTS_WEBHOOK_KEY` is correct
- Ensure webhook payload is not modified
- Check that signature header is `x-dodo-signature`

#### 4. Subscription Not Found in Webhook

**Error**: `Subscription not found for webhook`

**Possible Causes**:
- Subscription record not created before webhook
- Wrong subscription ID mapping
- Database connection issue

**Solution**: Check that subscription is created before checkout session. Verify `external_subscription_id` mapping.

#### 5. Product Already Exists

**Error**: Product creation fails with "already exists"

**Solution**: The system automatically handles this by checking for existing products first. If error persists, check product ID format: `tier_{tierLevel}_{creatorId}`

### Debugging

Enable detailed logging:

```typescript
// Check logs for Dodo-related entries
logger.info('Dodo operation', 'DODO_CLIENT', { ... });
```

All Dodo operations are logged with context:
- `DODO_CLIENT`: API client operations
- `DODO_SUBSCRIPTION`: Subscription initiation
- `DODO_WEBHOOK`: Webhook processing
- `DODO_VERIFY`: Subscription verification
- `DODO_CANCEL`: Subscription cancellation

### Environment Variables Checklist

```bash
# Required
DODO_PAYMENTS_API_KEY=✓
DODO_PAYMENTS_WEBHOOK_KEY=✓
DODO_PAYMENTS_ENVIRONMENT=test_mode|production

# Optional (auto-detected)
DODO_PAYMENTS_RETURN_URL=  # Auto-detects localhost/Vercel
NEXT_PUBLIC_APP_URL=       # Custom domain
VERCEL_URL=                # Auto-set by Vercel

# Optional (exchange rate)
DODO_PAYMENTS_EXCHANGE_RATE=144.71  # NPR per USD (optional, auto-fetched from API)
# Example: 144.71 means 144.71 NPR = 1 USD
# If not set, system fetches real-time rate from ExchangeRate-API
# Set this only if you want to override the API rate
```

---

## API Client Methods

### DodoPaymentsClient

**Location**: `lib/dodo/client.ts`

#### createCheckoutSession()

Creates a checkout session (recommended method):

```typescript
const session = await dodoClient.createCheckoutSession({
  product_cart: [{ product_id: '...', quantity: 1 }],
  customer: { email: '...', name: '...' },
  return_url: '...',
  metadata: { ... }
});
```

#### getCheckoutSession()

Gets checkout session status:

```typescript
const session = await dodoClient.getCheckoutSession(sessionId);
// Returns: { id, customer_email, payment_id, payment_status }
```

#### createProduct()

Creates a product in Dodo:

```typescript
const product = await dodoClient.createProduct({
  name: '...',
  description: '...',
  price: { type: 'recurring_price', ... },
  tax_category: 'saas'
});
```

#### getProduct()

Gets product details:

```typescript
const product = await dodoClient.getProduct(productId);
```

#### verifyWebhookSignature()

Verifies webhook signature:

```typescript
const isValid = dodoClient.verifyWebhookSignature(payload, signature);
```

---

## Database Schema

### Subscriptions Table

Dodo subscriptions are stored in the `subscriptions` table:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  supporter_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  tier_level INTEGER,
  amount DECIMAL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_gateway VARCHAR(20) DEFAULT 'dodo',
  status VARCHAR(20), -- 'pending', 'active', 'cancelled', 'expired'
  external_subscription_id VARCHAR(255), -- Dodo subscription ID (if available)
  metadata JSONB, -- Stores dodo_checkout_session_id
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table

Dodo transactions are stored in `supporter_transactions`:

```sql
CREATE TABLE supporter_transactions (
  id UUID PRIMARY KEY,
  supporter_id UUID REFERENCES users(id),
  creator_id UUID REFERENCES users(id),
  amount VARCHAR(255),
  payment_method VARCHAR(20) CHECK (payment_method IN ('esewa', 'khalti', 'direct', 'dodo')),
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  tier_level INTEGER,
  transaction_uuid VARCHAR(255),
  metadata JSONB, -- Stores dodo_checkout_session_id, subscription_id
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Considerations

1. **API Key Security**: Never expose API keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS in production (Vercel automatically provides this)
4. **Environment Variables**: Store sensitive data in environment variables
5. **Input Validation**: All inputs are validated before processing

---

## Best Practices

1. **Product Management**: Products are created on-the-fly but cached (check before create)
2. **Error Handling**: Comprehensive error handling with detailed logging
3. **Idempotency**: Operations can be safely retried
4. **Unified Engines**: All payment processing goes through unified engines for consistency
5. **Testing**: Always test in test mode before going live
6. **Exchange Rate**: System automatically fetches real-time rates from ExchangeRate-API (free tier, no key required)
7. **Rate Caching**: Exchange rates are cached for 1 hour to minimize API calls
8. **Amount Storage**: Original NPR amounts are always stored in metadata for reference and reconciliation
9. **Fallback**: If exchange rate API fails, system uses default rate (100 NPR = 1 USD)

---

## Support and Resources

- **Dodo Payments Documentation**: https://docs.dodopayments.com
- **API Reference**: https://docs.dodopayments.com/api-reference
- **Exchange Rate API**: https://www.exchangerate-api.com (free tier, no key required)
- **Test Script**: `scripts/test-dodo-payments.ts`
- **Configuration**: `lib/dodo/config.ts`
- **Client**: `lib/dodo/client.ts`
- **Exchange Rate Utility**: `lib/dodo/exchange-rate.ts`
- **Types**: `lib/dodo/types.ts`

---

## Summary

Dodo Payments is fully integrated into the unified payment system, providing:

- ✅ Subscription-based payments (Visa/Mastercard)
- ✅ Hosted checkout experience
- ✅ Webhook support for recurring payments
- ✅ Integration with unified payment/subscription engines
- ✅ Automatic product management
- ✅ Real-time exchange rate conversion (NPR to USD)
- ✅ Comprehensive error handling and logging
- ✅ Test mode support

The integration follows the same patterns as other payment gateways, ensuring consistency and maintainability across the entire payment system.
