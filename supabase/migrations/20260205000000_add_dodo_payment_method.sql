-- Add 'dodo' to allowed payment_method values in supporter_transactions
-- This enables Dodo Payments (Visa/Mastercard) integration

-- Drop the existing check constraint
ALTER TABLE supporter_transactions 
DROP CONSTRAINT IF EXISTS supporter_transactions_payment_method_check;

-- Add the new check constraint with 'dodo' included
ALTER TABLE supporter_transactions 
ADD CONSTRAINT supporter_transactions_payment_method_check 
CHECK (payment_method IN ('esewa', 'khalti', 'bank_transfer', 'direct', 'dodo'));

-- Add comment for documentation
COMMENT ON CONSTRAINT supporter_transactions_payment_method_check ON supporter_transactions 
IS 'Allowed payment methods: esewa, khalti, bank_transfer, direct, dodo';
