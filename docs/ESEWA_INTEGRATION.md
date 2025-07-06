# eSewa Payment Integration for CreatorsNepal

## Overview

This document outlines the complete eSewa payment integration for CreatorsNepal, allowing supporters to directly support creators through eSewa's secure payment gateway.

## Key Findings from eSewa Documentation Analysis

### 1. Payment Flow Limitations
- **Direct payment without app switching is NOT possible** with eSewa ePay
- Users must be redirected to eSewa's secure login page for authentication
- This is a security requirement and industry standard for payment gateways

### 2. Integration Approaches

#### Option A: Merchant Account Integration (Recommended for Established Creators)
- Creators register as eSewa merchants
- Payments go directly to creator's merchant account
- Requires merchant credentials (product_code, secret_key)
- Best for creators with business accounts

#### Option B: QR Code Person-to-Person (P2P) Transfers (For Individual Creators)
- Creators share their eSewa QR codes
- Supporters scan and pay directly
- No merchant account required
- Manual confirmation needed

#### Option C: Payment Aggregator Model (Platform-Level)
- CreatorsNepal acts as merchant aggregator
- All payments come to platform account
- Platform distributes funds to creators
- Requires business partnership with eSewa

## Current Implementation

### What Creators Need to Upload/Configure

#### For Merchant Integration:
1. **eSewa Merchant Account**
   - Product Code (e.g., "EPAYTEST" for testing)
   - Secret Key (e.g., "8gBm/:&EnhH.1/q" for testing)
   - Merchant ID

2. **Business Information**
   - Registered business name
   - Business verification documents
   - Bank account details

#### For QR Code Integration:
1. **Personal eSewa Account**
   - Valid eSewa mobile number
   - QR code image/screenshot
   - Account verification

### Test Credentials (Development)

```
eSewa Test Accounts:
- eSewa ID: 9806800001, 9806800002, 9806800003, 9806800004, 9806800005
- Password: Nepal@123
- MPIN: 1122
- Token: 123456

API Credentials:
- Product Code: EPAYTEST
- Secret Key: 8gBm/:&EnhH.1/q

URLs:
- Testing: https://rc-epay.esewa.com.np/api/epay/main/v2/form
- Production: https://epay.esewa.com.np/api/epay/main/v2/form
- Status Check: https://rc.esewa.com.np/api/epay/transaction/status/
```

## Technical Implementation

### 1. Database Schema

```sql
-- Stores creator payment method configurations
CREATE TABLE creator_payment_methods (
    id UUID PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    payment_type VARCHAR(20) CHECK (payment_type IN ('esewa', 'khalti', 'bank_transfer')),
    
    -- eSewa Merchant Fields
    esewa_merchant_id VARCHAR(100),
    esewa_product_code VARCHAR(50),
    esewa_secret_key TEXT, -- Encrypted
    
    -- QR Code Fields
    phone_number VARCHAR(20),
    qr_code_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tracks individual transactions
CREATE TABLE supporter_transactions (
    id UUID PRIMARY KEY,
    supporter_id UUID REFERENCES auth.users(id),
    creator_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    supporter_message TEXT,
    
    -- eSewa specific data
    esewa_product_code VARCHAR(50),
    esewa_signature TEXT,
    esewa_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### 2. Payment Flow

#### Supporter Initiates Payment:
1. Supporter selects creator to support
2. Enters amount and optional message
3. Chooses eSewa as payment method
4. System generates transaction record
5. Creates eSewa payment form with signature
6. Redirects to eSewa login page

#### eSewa Processing:
1. User logs into eSewa account
2. Confirms payment details
3. eSewa processes payment
4. Redirects back to success/failure page

#### Payment Verification:
1. System receives callback from eSewa
2. Verifies payment status via eSewa API
3. Updates transaction record
4. Notifies creator of successful payment

### 3. Security Implementation

#### HMAC SHA256 Signature Generation:
```javascript
const crypto = require('crypto');

function generateSignature(total_amount, transaction_uuid, product_code, secret_key) {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto.createHmac('sha256', secret_key).update(message).digest('base64');
}
```

#### Form Submission to eSewa:
```html
<form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
    <input type="hidden" name="amount" value="100">
    <input type="hidden" name="tax_amount" value="0">
    <input type="hidden" name="total_amount" value="100">
    <input type="hidden" name="transaction_uuid" value="unique-uuid">
    <input type="hidden" name="product_code" value="EPAYTEST">
    <input type="hidden" name="product_service_charge" value="0">
    <input type="hidden" name="product_delivery_charge" value="0">
    <input type="hidden" name="success_url" value="https://yourdomain.com/payment/success">
    <input type="hidden" name="failure_url" value="https://yourdomain.com/payment/failure">
    <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
    <input type="hidden" name="signature" value="generated-signature">
</form>
```

### 4. API Endpoints

#### `/api/payment/esewa` (POST)
- Initiates eSewa payment
- Generates signature
- Creates transaction record
- Returns payment form data

#### `/api/payment/esewa/verify` (GET)
- Verifies payment with eSewa
- Updates transaction status
- Returns verification result

### 5. UI Components

#### Creator Dashboard - Payments Tab:
- eSewa merchant configuration
- QR code upload interface
- Payment method testing
- Transaction history
- Earnings analytics

#### Supporter Payment Interface:
- Amount selection (NPR 100, 500, 1000, custom)
- Message input
- Payment method selection
- Secure payment processing

## Deployment Checklist

### For Testing:
- [ ] Use test credentials provided above
- [ ] Point to testing URL: `https://rc-epay.esewa.com.np/`
- [ ] Test with provided eSewa test accounts
- [ ] Verify signature generation
- [ ] Test payment flow end-to-end

### For Production:
- [ ] Obtain production eSewa merchant account
- [ ] Update to production URL: `https://epay.esewa.com.np/`
- [ ] Store secret keys securely (encrypted)
- [ ] Implement proper error handling
- [ ] Set up payment reconciliation
- [ ] Configure webhook endpoints
- [ ] Test with real eSewa accounts

## Limitations & Considerations

### Technical Limitations:
1. **No Direct API**: eSewa requires form submission, not REST API
2. **Mandatory Redirect**: Users must leave your app temporarily
3. **Limited Customization**: Payment UI is controlled by eSewa
4. **Manual Verification**: Some failed payments may need manual checking

### Business Considerations:
1. **Merchant Account Requirement**: Individual creators need business accounts
2. **Transaction Fees**: eSewa charges fees on transactions
3. **Settlement Time**: Payments may take time to reflect in merchant accounts
4. **KYC Requirements**: Creators need proper verification

## Alternative Solutions

### For Creators Without Merchant Accounts:
1. **QR Code Integration**: Use personal eSewa QR codes
2. **Manual Confirmation**: Supporters upload payment screenshots
3. **Platform Aggregation**: CreatorsNepal becomes payment aggregator

### Future Enhancements:
1. **eSewa Connect API**: If available, for better integration
2. **Automatic Reconciliation**: Match payments with transactions
3. **Multi-currency Support**: USD, EUR for international supporters
4. **Subscription Payments**: Recurring support for creators

## Support & Troubleshooting

### Common Issues:
1. **Signature Mismatch**: Check parameter order and encoding
2. **Invalid Merchant**: Verify product_code and secret_key
3. **Network Timeout**: Implement retry mechanism
4. **Duplicate Transactions**: Use unique UUIDs

### eSewa Support:
- Phone: 01-5970002
- Email: support@esewa.com.np
- Developer Portal: https://developer.esewa.com.np/

### Testing Resources:
- Test environment: https://rc-epay.esewa.com.np/
- Documentation: https://developer.esewa.com.np/pages/Epay
- Status API: https://rc.esewa.com.np/api/epay/transaction/status/

This integration provides a robust foundation for eSewa payments while working within the platform's constraints and security requirements. 

## Overview

This document outlines the complete eSewa payment integration for CreatorsNepal, allowing supporters to directly support creators through eSewa's secure payment gateway.

## Key Findings from eSewa Documentation Analysis

### 1. Payment Flow Limitations
- **Direct payment without app switching is NOT possible** with eSewa ePay
- Users must be redirected to eSewa's secure login page for authentication
- This is a security requirement and industry standard for payment gateways

### 2. Integration Approaches

#### Option A: Merchant Account Integration (Recommended for Established Creators)
- Creators register as eSewa merchants
- Payments go directly to creator's merchant account
- Requires merchant credentials (product_code, secret_key)
- Best for creators with business accounts

#### Option B: QR Code Person-to-Person (P2P) Transfers (For Individual Creators)
- Creators share their eSewa QR codes
- Supporters scan and pay directly
- No merchant account required
- Manual confirmation needed

#### Option C: Payment Aggregator Model (Platform-Level)
- CreatorsNepal acts as merchant aggregator
- All payments come to platform account
- Platform distributes funds to creators
- Requires business partnership with eSewa

## Current Implementation

### What Creators Need to Upload/Configure

#### For Merchant Integration:
1. **eSewa Merchant Account**
   - Product Code (e.g., "EPAYTEST" for testing)
   - Secret Key (e.g., "8gBm/:&EnhH.1/q" for testing)
   - Merchant ID

2. **Business Information**
   - Registered business name
   - Business verification documents
   - Bank account details

#### For QR Code Integration:
1. **Personal eSewa Account**
   - Valid eSewa mobile number
   - QR code image/screenshot
   - Account verification

### Test Credentials (Development)

```
eSewa Test Accounts:
- eSewa ID: 9806800001, 9806800002, 9806800003, 9806800004, 9806800005
- Password: Nepal@123
- MPIN: 1122
- Token: 123456

API Credentials:
- Product Code: EPAYTEST
- Secret Key: 8gBm/:&EnhH.1/q

URLs:
- Testing: https://rc-epay.esewa.com.np/api/epay/main/v2/form
- Production: https://epay.esewa.com.np/api/epay/main/v2/form
- Status Check: https://rc.esewa.com.np/api/epay/transaction/status/
```

## Technical Implementation

### 1. Database Schema

```sql
-- Stores creator payment method configurations
CREATE TABLE creator_payment_methods (
    id UUID PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    payment_type VARCHAR(20) CHECK (payment_type IN ('esewa', 'khalti', 'bank_transfer')),
    
    -- eSewa Merchant Fields
    esewa_merchant_id VARCHAR(100),
    esewa_product_code VARCHAR(50),
    esewa_secret_key TEXT, -- Encrypted
    
    -- QR Code Fields
    phone_number VARCHAR(20),
    qr_code_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tracks individual transactions
CREATE TABLE supporter_transactions (
    id UUID PRIMARY KEY,
    supporter_id UUID REFERENCES auth.users(id),
    creator_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    supporter_message TEXT,
    
    -- eSewa specific data
    esewa_product_code VARCHAR(50),
    esewa_signature TEXT,
    esewa_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### 2. Payment Flow

#### Supporter Initiates Payment:
1. Supporter selects creator to support
2. Enters amount and optional message
3. Chooses eSewa as payment method
4. System generates transaction record
5. Creates eSewa payment form with signature
6. Redirects to eSewa login page

#### eSewa Processing:
1. User logs into eSewa account
2. Confirms payment details
3. eSewa processes payment
4. Redirects back to success/failure page

#### Payment Verification:
1. System receives callback from eSewa
2. Verifies payment status via eSewa API
3. Updates transaction record
4. Notifies creator of successful payment

### 3. Security Implementation

#### HMAC SHA256 Signature Generation:
```javascript
const crypto = require('crypto');

function generateSignature(total_amount, transaction_uuid, product_code, secret_key) {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto.createHmac('sha256', secret_key).update(message).digest('base64');
}
```

#### Form Submission to eSewa:
```html
<form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
    <input type="hidden" name="amount" value="100">
    <input type="hidden" name="tax_amount" value="0">
    <input type="hidden" name="total_amount" value="100">
    <input type="hidden" name="transaction_uuid" value="unique-uuid">
    <input type="hidden" name="product_code" value="EPAYTEST">
    <input type="hidden" name="product_service_charge" value="0">
    <input type="hidden" name="product_delivery_charge" value="0">
    <input type="hidden" name="success_url" value="https://yourdomain.com/payment/success">
    <input type="hidden" name="failure_url" value="https://yourdomain.com/payment/failure">
    <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
    <input type="hidden" name="signature" value="generated-signature">
</form>
```

### 4. API Endpoints

#### `/api/payment/esewa` (POST)
- Initiates eSewa payment
- Generates signature
- Creates transaction record
- Returns payment form data

#### `/api/payment/esewa/verify` (GET)
- Verifies payment with eSewa
- Updates transaction status
- Returns verification result

### 5. UI Components

#### Creator Dashboard - Payments Tab:
- eSewa merchant configuration
- QR code upload interface
- Payment method testing
- Transaction history
- Earnings analytics

#### Supporter Payment Interface:
- Amount selection (NPR 100, 500, 1000, custom)
- Message input
- Payment method selection
- Secure payment processing

## Deployment Checklist

### For Testing:
- [ ] Use test credentials provided above
- [ ] Point to testing URL: `https://rc-epay.esewa.com.np/`
- [ ] Test with provided eSewa test accounts
- [ ] Verify signature generation
- [ ] Test payment flow end-to-end

### For Production:
- [ ] Obtain production eSewa merchant account
- [ ] Update to production URL: `https://epay.esewa.com.np/`
- [ ] Store secret keys securely (encrypted)
- [ ] Implement proper error handling
- [ ] Set up payment reconciliation
- [ ] Configure webhook endpoints
- [ ] Test with real eSewa accounts

## Limitations & Considerations

### Technical Limitations:
1. **No Direct API**: eSewa requires form submission, not REST API
2. **Mandatory Redirect**: Users must leave your app temporarily
3. **Limited Customization**: Payment UI is controlled by eSewa
4. **Manual Verification**: Some failed payments may need manual checking

### Business Considerations:
1. **Merchant Account Requirement**: Individual creators need business accounts
2. **Transaction Fees**: eSewa charges fees on transactions
3. **Settlement Time**: Payments may take time to reflect in merchant accounts
4. **KYC Requirements**: Creators need proper verification

## Alternative Solutions

### For Creators Without Merchant Accounts:
1. **QR Code Integration**: Use personal eSewa QR codes
2. **Manual Confirmation**: Supporters upload payment screenshots
3. **Platform Aggregation**: CreatorsNepal becomes payment aggregator

### Future Enhancements:
1. **eSewa Connect API**: If available, for better integration
2. **Automatic Reconciliation**: Match payments with transactions
3. **Multi-currency Support**: USD, EUR for international supporters
4. **Subscription Payments**: Recurring support for creators

## Support & Troubleshooting

### Common Issues:
1. **Signature Mismatch**: Check parameter order and encoding
2. **Invalid Merchant**: Verify product_code and secret_key
3. **Network Timeout**: Implement retry mechanism
4. **Duplicate Transactions**: Use unique UUIDs

### eSewa Support:
- Phone: 01-5970002
- Email: support@esewa.com.np
- Developer Portal: https://developer.esewa.com.np/

### Testing Resources:
- Test environment: https://rc-epay.esewa.com.np/
- Documentation: https://developer.esewa.com.np/pages/Epay
- Status API: https://rc.esewa.com.np/api/epay/transaction/status/

This integration provides a robust foundation for eSewa payments while working within the platform's constraints and security requirements. 

## Overview

This document outlines the complete eSewa payment integration for CreatorsNepal, allowing supporters to directly support creators through eSewa's secure payment gateway.

## Key Findings from eSewa Documentation Analysis

### 1. Payment Flow Limitations
- **Direct payment without app switching is NOT possible** with eSewa ePay
- Users must be redirected to eSewa's secure login page for authentication
- This is a security requirement and industry standard for payment gateways

### 2. Integration Approaches

#### Option A: Merchant Account Integration (Recommended for Established Creators)
- Creators register as eSewa merchants
- Payments go directly to creator's merchant account
- Requires merchant credentials (product_code, secret_key)
- Best for creators with business accounts

#### Option B: QR Code Person-to-Person (P2P) Transfers (For Individual Creators)
- Creators share their eSewa QR codes
- Supporters scan and pay directly
- No merchant account required
- Manual confirmation needed

#### Option C: Payment Aggregator Model (Platform-Level)
- CreatorsNepal acts as merchant aggregator
- All payments come to platform account
- Platform distributes funds to creators
- Requires business partnership with eSewa

## Current Implementation

### What Creators Need to Upload/Configure

#### For Merchant Integration:
1. **eSewa Merchant Account**
   - Product Code (e.g., "EPAYTEST" for testing)
   - Secret Key (e.g., "8gBm/:&EnhH.1/q" for testing)
   - Merchant ID

2. **Business Information**
   - Registered business name
   - Business verification documents
   - Bank account details

#### For QR Code Integration:
1. **Personal eSewa Account**
   - Valid eSewa mobile number
   - QR code image/screenshot
   - Account verification

### Test Credentials (Development)

```
eSewa Test Accounts:
- eSewa ID: 9806800001, 9806800002, 9806800003, 9806800004, 9806800005
- Password: Nepal@123
- MPIN: 1122
- Token: 123456

API Credentials:
- Product Code: EPAYTEST
- Secret Key: 8gBm/:&EnhH.1/q

URLs:
- Testing: https://rc-epay.esewa.com.np/api/epay/main/v2/form
- Production: https://epay.esewa.com.np/api/epay/main/v2/form
- Status Check: https://rc.esewa.com.np/api/epay/transaction/status/
```

## Technical Implementation

### 1. Database Schema

```sql
-- Stores creator payment method configurations
CREATE TABLE creator_payment_methods (
    id UUID PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    payment_type VARCHAR(20) CHECK (payment_type IN ('esewa', 'khalti', 'bank_transfer')),
    
    -- eSewa Merchant Fields
    esewa_merchant_id VARCHAR(100),
    esewa_product_code VARCHAR(50),
    esewa_secret_key TEXT, -- Encrypted
    
    -- QR Code Fields
    phone_number VARCHAR(20),
    qr_code_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tracks individual transactions
CREATE TABLE supporter_transactions (
    id UUID PRIMARY KEY,
    supporter_id UUID REFERENCES auth.users(id),
    creator_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    supporter_message TEXT,
    
    -- eSewa specific data
    esewa_product_code VARCHAR(50),
    esewa_signature TEXT,
    esewa_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### 2. Payment Flow

#### Supporter Initiates Payment:
1. Supporter selects creator to support
2. Enters amount and optional message
3. Chooses eSewa as payment method
4. System generates transaction record
5. Creates eSewa payment form with signature
6. Redirects to eSewa login page

#### eSewa Processing:
1. User logs into eSewa account
2. Confirms payment details
3. eSewa processes payment
4. Redirects back to success/failure page

#### Payment Verification:
1. System receives callback from eSewa
2. Verifies payment status via eSewa API
3. Updates transaction record
4. Notifies creator of successful payment

### 3. Security Implementation

#### HMAC SHA256 Signature Generation:
```javascript
const crypto = require('crypto');

function generateSignature(total_amount, transaction_uuid, product_code, secret_key) {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto.createHmac('sha256', secret_key).update(message).digest('base64');
}
```

#### Form Submission to eSewa:
```html
<form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
    <input type="hidden" name="amount" value="100">
    <input type="hidden" name="tax_amount" value="0">
    <input type="hidden" name="total_amount" value="100">
    <input type="hidden" name="transaction_uuid" value="unique-uuid">
    <input type="hidden" name="product_code" value="EPAYTEST">
    <input type="hidden" name="product_service_charge" value="0">
    <input type="hidden" name="product_delivery_charge" value="0">
    <input type="hidden" name="success_url" value="https://yourdomain.com/payment/success">
    <input type="hidden" name="failure_url" value="https://yourdomain.com/payment/failure">
    <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
    <input type="hidden" name="signature" value="generated-signature">
</form>
```

### 4. API Endpoints

#### `/api/payment/esewa` (POST)
- Initiates eSewa payment
- Generates signature
- Creates transaction record
- Returns payment form data

#### `/api/payment/esewa/verify` (GET)
- Verifies payment with eSewa
- Updates transaction status
- Returns verification result

### 5. UI Components

#### Creator Dashboard - Payments Tab:
- eSewa merchant configuration
- QR code upload interface
- Payment method testing
- Transaction history
- Earnings analytics

#### Supporter Payment Interface:
- Amount selection (NPR 100, 500, 1000, custom)
- Message input
- Payment method selection
- Secure payment processing

## Deployment Checklist

### For Testing:
- [ ] Use test credentials provided above
- [ ] Point to testing URL: `https://rc-epay.esewa.com.np/`
- [ ] Test with provided eSewa test accounts
- [ ] Verify signature generation
- [ ] Test payment flow end-to-end

### For Production:
- [ ] Obtain production eSewa merchant account
- [ ] Update to production URL: `https://epay.esewa.com.np/`
- [ ] Store secret keys securely (encrypted)
- [ ] Implement proper error handling
- [ ] Set up payment reconciliation
- [ ] Configure webhook endpoints
- [ ] Test with real eSewa accounts

## Limitations & Considerations

### Technical Limitations:
1. **No Direct API**: eSewa requires form submission, not REST API
2. **Mandatory Redirect**: Users must leave your app temporarily
3. **Limited Customization**: Payment UI is controlled by eSewa
4. **Manual Verification**: Some failed payments may need manual checking

### Business Considerations:
1. **Merchant Account Requirement**: Individual creators need business accounts
2. **Transaction Fees**: eSewa charges fees on transactions
3. **Settlement Time**: Payments may take time to reflect in merchant accounts
4. **KYC Requirements**: Creators need proper verification

## Alternative Solutions

### For Creators Without Merchant Accounts:
1. **QR Code Integration**: Use personal eSewa QR codes
2. **Manual Confirmation**: Supporters upload payment screenshots
3. **Platform Aggregation**: CreatorsNepal becomes payment aggregator

### Future Enhancements:
1. **eSewa Connect API**: If available, for better integration
2. **Automatic Reconciliation**: Match payments with transactions
3. **Multi-currency Support**: USD, EUR for international supporters
4. **Subscription Payments**: Recurring support for creators

## Support & Troubleshooting

### Common Issues:
1. **Signature Mismatch**: Check parameter order and encoding
2. **Invalid Merchant**: Verify product_code and secret_key
3. **Network Timeout**: Implement retry mechanism
4. **Duplicate Transactions**: Use unique UUIDs

### eSewa Support:
- Phone: 01-5970002
- Email: support@esewa.com.np
- Developer Portal: https://developer.esewa.com.np/

### Testing Resources:
- Test environment: https://rc-epay.esewa.com.np/
- Documentation: https://developer.esewa.com.np/pages/Epay
- Status API: https://rc.esewa.com.np/api/epay/transaction/status/

This integration provides a robust foundation for eSewa payments while working within the platform's constraints and security requirements. 