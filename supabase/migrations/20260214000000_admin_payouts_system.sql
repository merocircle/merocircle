-- Admin Payouts System Migration
-- Creates tables for tracking creator payouts and platform earnings (5% cut)

-- Track batch payouts to creators
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'NPR',
  payout_method VARCHAR(50), -- 'bank_transfer', 'esewa', etc.
  payout_reference VARCHAR(255), -- transaction ref from bank/gateway
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  transaction_ids JSONB DEFAULT '[]'::jsonb, -- Array of transaction IDs included in this payout
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) -- Admin who created this payout
);

-- Track platform earnings (5% cut)
CREATE TABLE IF NOT EXISTS public.platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES supporter_transactions(id),
  transaction_amount NUMERIC(10,2) NOT NULL,
  platform_cut_percentage NUMERIC(5,2) DEFAULT 5.00,
  platform_amount NUMERIC(10,2) NOT NULL,
  creator_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add payout tracking to transactions
ALTER TABLE public.supporter_transactions
ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES creator_payouts(id),
ADD COLUMN IF NOT EXISTS payout_status VARCHAR(20) DEFAULT 'pending' 
  CHECK (payout_status IN ('pending', 'included_in_payout', 'paid_out'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON creator_payouts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_transaction ON platform_earnings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payout_status ON supporter_transactions(payout_status, creator_id);

-- Comments
COMMENT ON TABLE creator_payouts IS 'Admin-created batch payouts to creators';
COMMENT ON TABLE platform_earnings IS 'Tracks 5% platform cut from each transaction';
COMMENT ON COLUMN creator_payouts.transaction_ids IS 'Array of transaction UUIDs included in this payout';
COMMENT ON COLUMN supporter_transactions.payout_status IS 'Tracks if transaction has been paid out to creator';

-- Function to calculate platform earnings automatically
CREATE OR REPLACE FUNCTION calculate_platform_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Only insert if not already exists (idempotent)
    INSERT INTO platform_earnings (
      transaction_id,
      transaction_amount,
      platform_cut_percentage,
      platform_amount,
      creator_amount
    ) VALUES (
      NEW.id,
      NEW.amount,
      5.00,
      NEW.amount * 0.05,
      NEW.amount * 0.95
    )
    ON CONFLICT (transaction_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to platform_earnings to prevent duplicates
ALTER TABLE platform_earnings ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id);

-- Trigger to auto-calculate platform earnings when transaction completes
DROP TRIGGER IF EXISTS trg_platform_earnings ON supporter_transactions;
CREATE TRIGGER trg_platform_earnings
AFTER UPDATE ON supporter_transactions
FOR EACH ROW
EXECUTE FUNCTION calculate_platform_earnings();

-- Backfill platform_earnings for existing completed transactions
INSERT INTO platform_earnings (
  transaction_id,
  transaction_amount,
  platform_cut_percentage,
  platform_amount,
  creator_amount
)
SELECT 
  id,
  amount,
  5.00,
  amount * 0.05,
  amount * 0.95
FROM supporter_transactions
WHERE status = 'completed'
ON CONFLICT (transaction_id) DO NOTHING;
