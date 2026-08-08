-- Migration: Drop unused indexes flagged by Supabase Performance Advisor
-- Cleans up all 7 INFO level unused_index suggestions.

BEGIN;

DROP INDEX IF EXISTS public.idx_songs_upload_date;
DROP INDEX IF EXISTS public.idx_angel_user_data_selected_song_id;
DROP INDEX IF EXISTS public.idx_voucher_activity_user_id;
DROP INDEX IF EXISTS public.idx_vouchers_created_by;
DROP INDEX IF EXISTS public.idx_songs_title;
DROP INDEX IF EXISTS public.idx_voucher_activity_created;
DROP INDEX IF EXISTS public.idx_login_attempts_ip_time;

COMMIT;
