-- Migration: Re-add covering indexes for foreign keys (resolves unindexed_foreign_keys 0001)

BEGIN;

CREATE INDEX IF NOT EXISTS idx_angel_user_data_selected_song_id 
ON public.angel_user_data (selected_song_id);

CREATE INDEX IF NOT EXISTS idx_voucher_activity_user_id 
ON public.voucher_activity (user_id);

CREATE INDEX IF NOT EXISTS idx_vouchers_created_by 
ON public.vouchers (created_by);

COMMIT;
