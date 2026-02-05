# Third-Party Integrations Documentation

This document provides comprehensive information about all third-party services integrated into MeroCircle, including setup instructions, configuration, and implementation details.

## Table of Contents

1. [Supabase](#supabase)
2. [Stream Chat](#stream-chat)
3. [SendGrid](#sendgrid)
4. [eSewa Payment Gateway](#esewa-payment-gateway)
5. [Khalti Payment Gateway](#khalti-payment-gateway)
6. [Dodo Payments](#dodo-payments)

---

## Supabase

### Overview

Supabase serves as the primary backend infrastructure, providing:
- **PostgreSQL Database**: All application data storage
- **Authentication**: User authentication via Google OAuth
- **Storage**: File storage for images and media
- **Realtime**: Real-time subscriptions for notifications

### Setup Instructions

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
   ```

3. **Run Database Migrations**
   - All migrations are in `supabase/migrations/`
   - Execute them in order via Supabase SQL Editor or CLI

4. **Enable Google OAuth**
   - Go to Authentication → Providers in Supabase dashboard
   - Enable Google provider
   - Add OAuth credentials from Google Cloud Console

### Implementation Details

#### Client-Side Client
**File**: `lib/supabase.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(url, anonKey);
```

#### Server-Side Client
**File**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
export async function createClient() {
  return createServerClient(url, anonKey, { cookies });
}
```

#### Authentication Context
**File**: `contexts/supabase-auth-context.tsx`

- Manages user session state
- Handles Google OAuth sign-in
- Loads user profile and creator profile
- Provides authentication methods

### Key Features Used

- **Row Level Security (RLS)**: Database-level access control
- **Database Functions**: Custom PostgreSQL functions for complex queries
- **Realtime Subscriptions**: Real-time notifications
- **Storage Buckets**: Image uploads and media storage

### Database Schema

See migration files in `supabase/migrations/` for complete schema.

### API Usage Examples

```typescript
// Query data
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('creator_id', userId);

// Insert data
const { data, error } = await supabase
  .from('posts')
  .insert({ title, content, creator_id });

// Update data
const { error } = await supabase
  .from('posts')
  .update({ title: newTitle })
  .eq('id', postId);
```

---

## Stream Chat

### Overview

Stream Chat provides real-time messaging functionality, enabling:
- **Creator-Supporter Communication**: Direct messaging
- **Community Channels**: Creator-managed channels
- **Real-time Updates**: Instant message delivery

### Setup Instructions

1. **Create Stream Account**
   - Visit [getstream.io](https://getstream.io)
   - Sign up for a free account
   - Create a new app
   - Note your API Key and Secret

2. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
   STREAM_API_SECRET=your-stream-api-secret  # Server-side only
   ```

3. **Install Dependencies**
   ```bash
   npm install stream-chat stream-chat-react @stream-io/node-sdk
   ```

### Implementation Details

#### Server-Side Client
**File**: `lib/stream-server.ts`

```typescript
import { StreamChat } from 'stream-chat';
export const serverStreamClient = StreamChat.getInstance(apiKey, secret);
```

**Key Functions**:
- `generateStreamToken(userId)`: Generate user authentication token
- `upsertStreamUser(userId, name, image)`: Create/update Stream user
- `addMembersToStreamChannel(channelId, memberIds)`: Add members to channel
- `removeMemberFromStreamChannel(channelId, userId)`: Remove member

#### Client-Side Context
**File**: `contexts/stream-chat-context.tsx`

- Manages Stream Chat client connection
- Handles user authentication
- Provides chat client to components

#### Token Generation API
**File**: `app/api/stream/token/route.ts`

Generates authentication tokens for client-side Stream Chat usage.

### Channel Management

#### Channel Creation
**File**: `app/api/community/channels/route.ts`

Creates Stream channels for creator communities:
- Channel ID format: `ch_{creatorId}_{channelId}`
- Automatically adds creator as admin
- Syncs with database `community_channels` table

#### Channel Synchronization
**File**: `app/api/stream/sync-channels/route.ts`

Syncs database channels with Stream Chat channels.

### Usage Examples

```typescript
// Get Stream Chat client
const { chatClient } = useStreamChat();

// Create channel
const channel = chatClient.channel('messaging', channelId);
await channel.create();

// Send message
await channel.sendMessage({ text: 'Hello!' });

// Query channels
const filter = { members: { $in: [userId] } };
const channels = await chatClient.queryChannels(filter);
```

### Channel Types

- **Messaging Channels**: Standard chat channels
- **Creator Channels**: Community channels managed by creators
- **Direct Messages**: One-on-one conversations

---

## SendGrid

### Overview

SendGrid handles transactional email delivery, specifically:
- **Post Notifications**: Email alerts when creators post new content
- **Email Templates**: HTML and plain text email templates

### Setup Instructions

1. **Create SendGrid Account**
   - Visit [sendgrid.com](https://sendgrid.com)
   - Sign up for a free account (100 emails/day free tier)
   - Create an API key with "Mail Send" permissions

2. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Verify your sender email address or domain

3. **Configure Environment Variables**
   ```bash
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com  # Optional, defaults to noreply@merocircle.com
   ```

### Implementation Details

#### Email Service
**File**: `lib/sendgrid.ts`

**Key Functions**:
- `sendPostNotificationEmail(data)`: Send single email notification
- `sendBulkPostNotifications(supporters, postData)`: Send emails to multiple recipients

#### Email Templates

**HTML Template**: Responsive email design with:
- Creator name and post preview
- Post image (if available)
- Direct link to view post
- Branded styling

**Text Template**: Plain text fallback

#### Integration with Post Creation
**File**: `app/api/posts/route.ts`

After successful post creation:
1. Fetches all active supporters for the creator
2. Filters supporters with valid email addresses
3. Sends email notifications in batches (10 per batch)
4. Logs success/failure for monitoring

### Email Flow

```
Creator publishes post
  ↓
Post saved to database
  ↓
Fetch active supporters
  ↓
Filter supporters with emails
  ↓
Send emails in batches
  ↓
Log results
```

### Email Content

- **Subject**: `{CreatorName} just posted something new!`
- **From**: Configured sender email
- **Content**: Post title, preview, image, and link
- **Personalization**: Supporter name and creator name

### Rate Limiting

- Batch size: 10 emails per batch
- Delay between batches: 100ms
- Respects SendGrid rate limits

---

## eSewa Payment Gateway

### Overview

eSewa is Nepal's leading digital payment gateway, integrated for:
- **One-time Payments**: Support payments to creators
- **Secure Transactions**: Signature-based verification
- **Nepal-Specific**: Optimized for Nepali market

### Setup Instructions

1. **Register with eSewa**
   - Visit [esewa.com.np](https://esewa.com.np)
   - Register as a merchant
   - Get merchant code and secret key

2. **Test Credentials** (Development)
   ```
   Merchant Code: EPAYTEST
   Secret Key: 8gBm/:&EnhH.1/q
   Test User: ID: 9806800001, Password: Nepal@123, MPIN: 1122
   ```

3. **Configure Environment Variables**
   ```bash
   ESEWA_MERCHANT_CODE=your-merchant-code
   ESEWA_SECRET_KEY=your-secret-key
   ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
   ESEWA_VERIFICATION_URL=https://rc-epay.esewa.com.np/api/epay/transactions/status
   ESEWA_TEST_MODE=true  # Set to false for production
   ```

### Implementation Details

#### Configuration
**File**: `lib/config.ts`

```typescript
esewa: {
  merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  paymentUrl: process.env.ESEWA_PAYMENT_URL || '...',
  verificationUrl: process.env.ESEWA_VERIFICATION_URL || '...',
  testMode: process.env.ESEWA_TEST_MODE !== 'false',
}
```

#### Signature Generation
**File**: `lib/generateEsewaSignature.ts`

Generates HMAC-SHA256 signature for payment verification:
```typescript
generateEsewaSignature(secretKey, dataString)
```

#### Payment Initiation
**File**: `app/api/payment/initiate/route.ts`

1. Validates payment request
2. Generates unique transaction UUID
3. Creates eSewa payment form data
4. Generates signature
5. Stores pending transaction
6. Returns payment form data

#### Payment Verification
**File**: `app/api/payment/verify/route.ts`

1. Receives callback from eSewa
2. Verifies signature
3. Calls eSewa verification API
4. Updates transaction status
5. Creates/updates supporter record

### Payment Flow

```
1. Supporter initiates payment
   ↓
2. POST /api/payment/initiate
   ↓
3. Generate transaction UUID & signature
   ↓
4. Store pending transaction
   ↓
5. Return payment form
   ↓
6. Redirect to eSewa
   ↓
7. User completes payment
   ↓
8. eSewa redirects to success URL
   ↓
9. POST /api/payment/verify
   ↓
10. Verify signature & status
    ↓
11. Update transaction & create supporter
```

### Security Features

- **Signature Verification**: HMAC-SHA256 signature
- **Transaction UUID**: Unique identifier per transaction
- **Server-Side Verification**: All verification on server
- **Rate Limiting**: Prevents abuse

---

## Khalti Payment Gateway

### Overview

Khalti is Nepal's digital wallet service, integrated for:
- **Digital Wallet Payments**: Quick payments via Khalti wallet
- **Alternative Payment Method**: Additional option for supporters
- **Nepal-Specific**: Optimized for Nepali market

### Setup Instructions

1. **Register with Khalti**
   - Visit [test-admin.khalti.com](https://test-admin.khalti.com) for testing
   - Register for a free test account
   - Get public key and secret key from dashboard

2. **Test Credentials** (Development)
   ```
   Test Mobile: 9800000000
   Test MPIN: 1111
   Test OTP: 987654
   ```

3. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_KHALTI_PUBLIC_KEY=your-public-key
   KHALTI_SECRET_KEY=your-secret-key
   KHALTI_TEST_MODE=true  # Set to false for production
   ```

### Implementation Details

#### Configuration
**File**: `lib/khalti/config.ts`

```typescript
export const khaltiConfig = {
  publicKey: process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY,
  secretKey: process.env.KHALTI_SECRET_KEY,
  testMode: process.env.KHALTI_TEST_MODE !== 'false',
  initiateUrl: testMode ? 'https://khalti.com/api/v2/epayment/initiate/' : '...',
  lookupUrl: testMode ? 'https://khalti.com/api/v2/epayment/lookup/' : '...',
}
```

#### Types
**File**: `lib/khalti/types.ts`

TypeScript interfaces for Khalti API requests and responses.

#### Payment Initiation
**File**: `app/api/payment/khalti/initiate/route.ts`

1. Validates payment request
2. Converts NPR to paisa (Khalti uses paisa)
3. Generates purchase order ID
4. Calls Khalti initiate API
5. Stores pending transaction
6. Returns payment URL

#### Payment Verification
**File**: `app/api/payment/khalti/verify/route.ts`

1. Receives callback from Khalti
2. Calls Khalti lookup API
3. Verifies payment status
4. Updates transaction
5. Creates/updates supporter record

### Payment Flow

```
1. Supporter initiates payment
   ↓
2. POST /api/payment/khalti/initiate
   ↓
3. Convert NPR to paisa
   ↓
4. Call Khalti initiate API
   ↓
5. Store pending transaction
   ↓
6. Redirect to Khalti payment page
   ↓
7. User completes payment
   ↓
8. Khalti redirects to callback
   ↓
9. POST /api/payment/khalti/verify
   ↓
10. Verify with Khalti lookup API
    ↓
11. Update transaction & create supporter
```

### Key Differences from eSewa

- **Amount Format**: Khalti uses paisa (multiply NPR by 100)
- **API-Based**: Direct API calls instead of form submission
- **Purchase Order ID**: Custom format required
- **Lookup API**: Separate verification endpoint

---

## Environment Variables Summary

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stream Chat
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=  # Optional

# eSewa
ESEWA_MERCHANT_CODE=
ESEWA_SECRET_KEY=
ESEWA_TEST_MODE=true

# Khalti
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=
KHALTI_SECRET_KEY=
KHALTI_TEST_MODE=true

# Application
NEXT_PUBLIC_APP_URL=
```

### Optional Variables

```bash
# eSewa URLs (defaults provided)
ESEWA_PAYMENT_URL=
ESEWA_VERIFICATION_URL=

# Khalti URLs (auto-configured based on test mode)
KHALTI_RETURN_URL=
KHALTI_WEBSITE_URL=
```

---

## Integration Testing

### Supabase
- Test authentication flow
- Verify database queries
- Check storage uploads

### Stream Chat
- Test channel creation
- Verify message sending
- Check user synchronization

### SendGrid
- Send test email
- Verify email delivery
- Check template rendering

### eSewa
- Use test credentials
- Complete test payment
- Verify transaction

### Khalti
- Use test account
- Complete test payment
- Verify transaction

---

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify environment variables
   - Check network connectivity
   - Verify project is active

2. **Stream Chat Connection Issues**
   - Verify API key and secret
   - Check token generation
   - Verify user ID format

3. **SendGrid Email Failures**
   - Verify API key permissions
   - Check sender verification
   - Review email logs

4. **Payment Gateway Issues**
   - Verify credentials
   - Check test mode settings
   - Review callback URLs

---

## Dodo Payments

### Overview

Dodo Payments provides subscription-based payment processing with support for **Visa/Mastercard** credit and debit cards. It's designed for recurring monthly payments and offers a hosted checkout experience.

**Key Features**:
- Subscription-based payments (monthly recurring)
- Visa/Mastercard support
- Hosted checkout page
- Webhook support for payment events
- Test mode for development

### Setup Instructions

1. **Create Dodo Payments Account**
   - Visit [dodopayments.com](https://dodopayments.com)
   - Sign up and complete business verification
   - Access your dashboard

2. **Get API Credentials**
   - Navigate to **Settings → API Keys**
   - Copy your **API Key** (starts with `v3...`)
   - Copy your **Webhook Secret** (starts with `whsec_...`)

3. **Configure Environment Variables**
   ```bash
   DODO_PAYMENTS_API_KEY=your_api_key
   DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_secret
   DODO_PAYMENTS_ENVIRONMENT=test_mode  # or 'production'
   ```

4. **Configure Webhook URL**
   - In Dodo dashboard: **Settings → Webhooks**
   - Add URL: `https://yourdomain.com/api/payment/dodo/webhook`
   - Select events: `subscription.activated`, `payment.succeeded`, `subscription.cancelled`, `subscription.expired`, `payment.failed`

### Implementation Details

#### Configuration
**File**: `lib/dodo/config.ts`

```typescript
export const dodoConfig = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  returnUrl: getBaseUrl(), // Auto-detects localhost or Vercel
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test',
  apiUrl: getApiUrl(), // test.dodopayments.com or live.dodopayments.com
};
```

#### API Client
**File**: `lib/dodo/client.ts`

Provides methods for:
- `createCheckoutSession()` - Creates checkout session (recommended)
- `getCheckoutSession()` - Gets session status
- `createProduct()` - Creates product in Dodo
- `getProduct()` - Gets product details
- `verifyWebhookSignature()` - Verifies webhook signatures

#### API Endpoints

1. **POST /api/payment/dodo/subscription/initiate**
   - Creates checkout session
   - Returns payment URL for redirection

2. **GET /api/payment/dodo/subscription/verify**
   - Verifies subscription after user returns
   - Processes payment success

3. **POST /api/payment/dodo/webhook**
   - Receives payment events from Dodo
   - Processes through unified engines

4. **POST /api/payment/dodo/subscription/cancel**
   - Cancels active subscription
   - Cleans up resources

### Payment Flow

1. User selects Dodo payment option
2. Frontend calls `/api/payment/dodo/subscription/initiate`
3. System creates/gets product in Dodo
4. System creates checkout session
5. User redirected to Dodo hosted checkout
6. User completes payment with card
7. User redirected to `/payment/success?gateway=dodo&...`
8. Success page calls verify endpoint
9. Payment Success Engine processes payment
10. Webhooks handle recurring payments

### Integration with Unified Engines

Dodo Payments uses the same unified engines as other payment gateways:

- **Payment Success Engine** (`lib/payment-success-engine.ts`)
  - Updates transactions
  - Calls subscription engine
  - Syncs with Stream Chat

- **Subscription Engine** (`lib/subscription-engine.ts`)
  - Manages supporter records
  - Handles tier access
  - Updates channel memberships

- **Unsubscribe Engine** (`lib/unsubscribe-engine.ts`)
  - Handles cancellations
  - Removes channel access
  - Sends notifications

### Testing

Run the test script:
```bash
npx tsx scripts/test-dodo-payments.ts
```

Test cards are provided by Dodo Payments for testing in test mode.

### Resources

- **Full Documentation**: See [DODO-PAYMENTS-INTEGRATION.md](./DODO-PAYMENTS-INTEGRATION.md)
- **Dodo Payments Docs**: https://docs.dodopayments.com
- **API Reference**: https://docs.dodopayments.com/api-reference
- **Test Script**: `scripts/test-dodo-payments.ts`

---

**Last Updated**: February 2025
