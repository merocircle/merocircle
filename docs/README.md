# MeroCircle Documentation

Welcome to the MeroCircle documentation! This guide will help you understand the entire system architecture, features, and implementation details.

## Documentation Structure

### Core Documentation

1. **[Running Tests](TESTING.md)** 🧪
   - Commands for Vitest and Playwright
   - Auth in tests, CI, troubleshooting

2. **[Technical Overview](01-TECHNICAL-OVERVIEW.md)** 📋
   - Technology stack overview
   - Project structure
   - Key features summary
   - Development workflow

3. **[Architecture Documentation](02-ARCHITECTURE.md)** 🏗️
   - System architecture diagrams
   - Unified engines (payment, subscription, notification, etc.)
   - Data flow and integration patterns
   - Frontend and backend architecture

4. **[Third-Party Integrations](03-THIRD-PARTY-INTEGRATIONS.md)** 🔌
   - Payment gateways (eSewa, Khalti, Dodo)
   - Stream Chat integration
   - Email service setup
   - Supabase configuration
   - Environment variables reference

5. **[Database Schema](07-DATABASE-SCHEMA.md)** 🗄️
   - Complete schema documentation
   - Table relationships
   - Indexes and constraints
   - Migration history

### Feature-Specific Documentation

6. **[Subscription System](SUBSCRIPTION-SYSTEM.md)** ⭐ **COMPREHENSIVE**
   - Complete subscription lifecycle
   - Payment gateway types and differences
   - Tier changes (upgrades, downgrades, renewals)
   - Expiry tracking and reminders (eSewa/Khalti)
   - User interface (Settings → Subscriptions)
   - API endpoints
   - Testing and troubleshooting
   - **Read this for complete understanding of subscriptions!**

7. **[Dodo Payments Integration](DODO-PAYMENTS-INTEGRATION.md)** 💳
   - Visa/Mastercard payment processing
   - Checkout sessions and products
   - Webhook handling
   - Exchange rate conversion (NPR to USD)
   - Integration with unified engines

## Quick Start Guide

### For Developers

1. **Understanding the System**: Start with [Technical Overview](01-TECHNICAL-OVERVIEW.md)
2. **Architecture**: Read [Architecture Documentation](02-ARCHITECTURE.md) to understand the unified engines
3. **Subscriptions**: Read [Subscription System](SUBSCRIPTION-SYSTEM.md) for the core feature
4. **Integrations**: Refer to [Third-Party Integrations](03-THIRD-PARTY-INTEGRATIONS.md) for setup
5. **Database**: Check [Database Schema](07-DATABASE-SCHEMA.md) when working with data

### For Product/Business Teams

1. **What is MeroCircle?**: Read the "Project Description" in [Technical Overview](01-TECHNICAL-OVERVIEW.md)
2. **How do subscriptions work?**: Read [Subscription System](SUBSCRIPTION-SYSTEM.md) sections:
   - Overview
   - Payment Gateway Types
   - Tier Change Scenarios
   - User Interface
3. **Payment methods**: See "Payment Gateways" in [Third-Party Integrations](03-THIRD-PARTY-INTEGRATIONS.md)

## Key Concepts

### Unified Engines

MeroCircle uses a unified engine architecture for consistency:

- **Payment Success Engine** - Processes all payment confirmations
- **Subscription Engine** - Manages supporter tiers and access
- **Expiry Engine** - Handles subscription expiration (eSewa/Khalti)
- **Unsubscribe Engine** - Processes cancellations and access revocation
- **Notification Engine** - Creates in-app notifications
- **Like Engine** - Handles post likes/unlikes
- **Comment Engine** - Manages comment creation
- **Post Publishing Engine** - Handles post creation
- **Activity Logging Engine** - Tracks user activities
- **Channel Management Engine** - Syncs Stream Chat channels

Learn more: [Architecture Documentation](02-ARCHITECTURE.md)

### Subscription Tiers

MeroCircle has 3 subscription tiers:

1. **One Star (Tier 1)**: Access to exclusive posts
2. **Two Star (Tier 2)**: Posts + Community chat access
3. **Three Star (Tier 3)**: Posts + Chat + Special perks

Each creator sets their own pricing for each tier.

Learn more: [Subscription System](SUBSCRIPTION-SYSTEM.md)

### Payment Gateways

MeroCircle supports 4 payment methods:

1. **eSewa**: One-time payment, 30-day subscription with manual renewal
2. **Khalti**: One-time payment, 30-day subscription with manual renewal
3. **Dodo**: Recurring automatic subscription (Visa/Mastercard)
4. **Direct**: No payment gateway, immediate access (for testing/special cases)

Learn more: [Subscription System - Payment Gateway Types](SUBSCRIPTION-SYSTEM.md#payment-gateway-types)

### Subscription Expiry (eSewa/Khalti)

For one-time payment gateways:

- **Day 0**: Payment received, 30-day access granted
- **Day 28**: "2 days until expiry" reminder email sent
- **Day 29**: "1 day until expiry" reminder email sent
- **Day 30**: Subscription expires, access revoked, "Expired" email sent
- **Day 30+**: User can renew anytime with "Quick Renew" button

Learn more: [Subscription System - Expiry Management](SUBSCRIPTION-SYSTEM.md#expiry-management)

### Tier Changes

**Key principle**: Every payment resets the 30-day clock.

Examples:
- You're Tier 1 (expires Feb 10), upgrade to Tier 2 on Jan 25
  - New expiry: **Feb 25** (not Feb 10!)
- You're Tier 3 (expires Feb 20), downgrade to Tier 1 on Feb 5
  - New expiry: **Mar 7** (30 days from Feb 5, not Feb 20!)

Learn more: [Subscription System - Tier Change Scenarios](SUBSCRIPTION-SYSTEM.md#tier-change-scenarios)

## API Reference

### Subscription APIs

- `POST /api/subscriptions/check-expiry` - Run expiry checks (Vercel Cron)
- `GET /api/subscriptions/my-subscriptions` - Fetch user's subscriptions
- `POST /api/subscriptions/quick-renew` - Quick renewal with saved preferences
- `POST /api/subscriptions/unsubscribe` - Cancel subscription

### Payment APIs

- `POST /api/payment/initiate` - eSewa payment
- `POST /api/payment/khalti/initiate` - Khalti payment
- `POST /api/payment/dodo/subscription/initiate` - Dodo subscription
- `POST /api/payment/direct` - Direct support (no gateway)
- `POST /api/payment/verify` - Verify eSewa/Khalti payment
- `POST /api/payment/dodo/webhook` - Handle Dodo webhooks

Full API reference: [Subscription System - API Endpoints](SUBSCRIPTION-SYSTEM.md#api-endpoints)

## Testing

6. **[Running Tests](TESTING.md)** 🧪
   - How to run unit/integration tests (Vitest) locally
   - How to run E2E tests (Playwright) locally
   - Test commands, auth in tests, and CI behaviour
   - Troubleshooting

### Test commands (quick reference)

- **Unit + integration:** `npm test` or `npm run test:watch`
- **Coverage:** `npm run test:coverage`
- **E2E:** `npm run test:e2e` (requires app at http://localhost:3000)

Full details: [TESTING.md](TESTING.md)

### Other test scripts

- `scripts/test-subscription-expiry.ts` - Test subscription expiry system
- `scripts/test-dodo-payments.ts` - Test Dodo Payments integration
- `scripts/test-email-system.js` - Test email queue and sending
- `scripts/clear-stream-channels.ts` - Clear Stream Chat channels (testing)

### Manual testing

See testing sections in:
- [Subscription System - Testing](SUBSCRIPTION-SYSTEM.md#testing)
- [Dodo Payments - Testing](DODO-PAYMENTS-INTEGRATION.md#testing)

## Troubleshooting

Common issues and solutions:

- **Subscription not expiring**: See [Subscription System - Troubleshooting](SUBSCRIPTION-SYSTEM.md#troubleshooting)
- **Payment gateway issues**: See [Third-Party Integrations - Troubleshooting](03-THIRD-PARTY-INTEGRATIONS.md)
- **Dodo payment errors**: See [Dodo Payments - Troubleshooting](DODO-PAYMENTS-INTEGRATION.md#troubleshooting)

## Contributing

When adding new features:

1. Follow the unified engine pattern (see [Architecture](02-ARCHITECTURE.md))
2. Update database schema via migrations
3. Add comprehensive logging
4. Write test scripts
5. Update relevant documentation

## Support

For questions or issues:
- Check documentation (you're here!)
- Review code comments in `lib/` directory
- Check logs for debugging information

---

**Documentation Version**: 1.0
**Last Updated**: February 2026
**System Version**: 0.2.0
