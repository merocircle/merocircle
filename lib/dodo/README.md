# Dodo Payments Integration

Dodo Payments integration for recurring subscriptions with Visa/Mastercard support.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_key_here
DODO_PAYMENTS_RETURN_URL=http://localhost:3000  # Your app URL
DODO_PAYMENTS_ENVIRONMENT=test  # Set to 'production' for live mode
```

## Features

- **Recurring Subscriptions**: Monthly billing for supporter tiers
- **Visa/Mastercard**: International card support
- **Webhook Integration**: Automatic subscription status updates
- **Unified Engine**: Integrates with existing payment/subscription engines
- **Gateway-Agnostic**: Uses the same tier_level system as other gateways

## API Endpoints

### 1. Initiate Subscription
```
POST /api/payment/dodo/subscription/initiate
Body: {
  amount: number,
  creatorId: string,
  supporterId: string,
  supporterMessage?: string,
  tier_level: 1 | 2 | 3
}
Response: {
  success: true,
  subscription_id: string,
  payment_url: string
}
```

### 2. Verify Subscription
```
GET /api/payment/dodo/subscription/verify?subscription_id=xxx&transaction_id=xxx
Response: {
  success: true,
  status: 'active',
  subscription: {...}
}
```

### 3. Cancel Subscription
```
POST /api/payment/dodo/subscription/cancel
Body: {
  subscription_id: string,
  creator_id: string
}
Response: {
  success: true,
  message: 'Subscription cancelled successfully'
}
```

### 4. Webhook Handler
```
POST /api/payment/dodo/webhook
Headers: {
  x-dodo-signature: string
}
Body: DodoWebhookEvent
```

## Webhook Events

- `subscription.activated`: First payment successful
- `payment.succeeded`: Recurring payment successful
- `subscription.cancelled`: User cancelled subscription
- `subscription.expired`: Subscription expired
- `payment.failed`: Payment failed

## Testing

Run the comprehensive test suite to validate all Dodo Payments API integrations:

```bash
# Using tsx (recommended)
npx tsx scripts/test-dodo-payments.ts

# Or using ts-node
npx ts-node scripts/test-dodo-payments.ts
```

The test script will:
- ✅ Test subscription creation
- ✅ Test subscription retrieval
- ✅ Test subscription cancellation
- ✅ Test webhook signature verification
- ✅ Test error handling for invalid requests
- ✅ Provide detailed error messages for debugging

**Note**: Make sure your `.env.local` has `DODO_PAYMENTS_API_KEY` set before running tests.

## Integration with Existing Engines

### Payment Success Engine
- Dodo payments call `processPaymentSuccess()` after successful payment
- Uses direct `tier_level` column (not gateway-specific)
- Handles tier upgrades/downgrades automatically

### Subscription Engine
- Manages supporter records and tier levels
- Updates channel access (add/remove based on tier)
- Syncs with Stream Chat
- Sends confirmation emails

### Unsubscribe Engine
- Handles subscription cancellations
- Removes from channels
- Updates Stream Chat membership
- Deactivates supporter record

## Testing

1. Set `DODO_TEST_MODE=true` in `.env.local`
2. Use test card numbers from Dodo documentation
3. Test subscription flow:
   - Create subscription
   - Verify activation
   - Test recurring payment (webhook)
   - Cancel subscription

## Production Checklist

- [ ] Set `DODO_TEST_MODE=false`
- [ ] Add production API keys
- [ ] Configure webhook URL in Dodo dashboard
- [ ] Test webhook signature verification
- [ ] Monitor subscription renewals
- [ ] Set up failed payment handling
