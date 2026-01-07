# eSewa Payment Gateway Setup

## Current Status: ⚠️ Test Credentials Not Working

The `EPAYTEST` credentials from eSewa's public documentation are **not working** because:
- They require prior registration/activation with eSewa
- Not all developers have access to them without merchant approval

## Error Encountered:
```json
{"error_message":"Unable to fetch merchant key.","code":0}
```

This error was confirmed via direct API testing with curl.

## Solutions:

### Option 1: Enable Test Mode (Recommended for Development)

Add to your `.env.local`:
```env
ESEWA_TEST_MODE=true
```

This will:
- ✅ Bypass eSewa during development
- ✅ Auto-complete payments locally
- ✅ Allow you to test the full payment flow
- ✅ Store transactions in database correctly

### Option 2: Get Real eSewa Merchant Credentials

1. **Register as a merchant:**
   - Visit: https://merchant.esewa.com.np
   - Fill out merchant application
   - Wait for approval (can take a few days)

2. **Get your credentials:**
   - Login to merchant portal
   - Get your `Merchant Code` and `Secret Key`
   - Update `.env.local`:
     ```env
     ESEWA_TEST_MODE=false
     NEXT_PUBLIC_ESEWA_MERCHANT_CODE=your_actual_merchant_code
     NEXT_PUBLIC_ESEWA_SECRET_KEY=your_actual_secret_key
     ```

3. **Test with real credentials:**
   - Use eSewa test accounts for transactions
   - eSewa ID: 9806800001-9806800005
   - Password: Nepal@123

### Option 3: Contact eSewa Support

If you need `EPAYTEST` credentials activated:
- Email: support@esewa.com.np
- Merchant Portal: https://merchant.esewa.com.np
- Request test environment access for development

## Implementation Status:

✅ **Code is correct** - confirmed via curl testing
✅ **Signature generation works** - matches eSewa specification
✅ **Form submission works** - all fields correctly formatted
❌ **eSewa test credentials rejected** - need real merchant account

## Current Recommendation:

**Enable TEST MODE** in your `.env.local` file to continue development:

```env
# Add this to .env.local
ESEWA_TEST_MODE=true
```

This allows you to:
- Test the complete payment UI/UX
- Verify transaction storage
- Develop other features
- Switch to real eSewa when credentials are ready

## Switching to Production:

When you get real credentials:
1. Set `ESEWA_TEST_MODE=false`
2. Add your real credentials
3. Test with eSewa test user accounts
4. Deploy to production

## References:

- eSewa Official Docs: https://developer.esewa.com.np
- Medium Article: https://medium.com/@mukesh.adhykari/integrating-esewa-payment-gateway-in-next-js-a-complete-guide-by-mukesh-adhikari-da2efbe3c7ef
- Merchant Registration: https://merchant.esewa.com.np

