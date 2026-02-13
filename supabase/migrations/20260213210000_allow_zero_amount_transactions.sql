-- Allow amount = 0 for supporter_transactions (free tier / direct zero payment)

ALTER TABLE public.supporter_transactions
DROP CONSTRAINT IF EXISTS supporter_transactions_amount_check;

ALTER TABLE public.supporter_transactions
ADD CONSTRAINT supporter_transactions_amount_check
CHECK (amount >= 0);

COMMENT ON CONSTRAINT supporter_transactions_amount_check ON public.supporter_transactions
IS 'Amount must be >= 0 (zero allowed for free Supporter tier)';
