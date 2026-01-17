-- Add 'direct' to allowed payment_method values in supporter_transactions

-- Drop the existing check constraint
ALTER TABLE supporter_transactions 
DROP CONSTRAINT IF EXISTS supporter_transactions_payment_method_check;

-- Add the new check constraint with 'direct' included
ALTER TABLE supporter_transactions 
ADD CONSTRAINT supporter_transactions_payment_method_check 
CHECK (payment_method IN ('esewa', 'khalti', 'bank_transfer', 'direct'));

-- Ensure transaction_uuid column exists (if it doesn't already)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'supporter_transactions' 
        AND column_name = 'transaction_uuid'
    ) THEN
        ALTER TABLE supporter_transactions 
        ADD COLUMN transaction_uuid VARCHAR(100);
        
        CREATE INDEX IF NOT EXISTS idx_supporter_transactions_transaction_uuid 
        ON supporter_transactions(transaction_uuid);
    END IF;
END $$;
