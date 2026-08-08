-- Migration: Add missing foreign key indexes and clean up redundant indexes
-- Resolves unindexed_foreign_keys (0001) and unused_index (0005) suggestions.

BEGIN;

-- ============================================================================
-- 1. Add covering indexes for unindexed foreign keys (lint 0001)
-- ============================================================================

-- angel_user_data.selected_song_id -> songs(id)
CREATE INDEX IF NOT EXISTS idx_angel_user_data_selected_song_id 
ON public.angel_user_data (selected_song_id);

-- voucher_activity.user_id -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_voucher_activity_user_id 
ON public.voucher_activity (user_id);

-- vouchers.created_by -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by 
ON public.vouchers (created_by);

-- ============================================================================
-- 2. Clean up redundant index (lint 0005)
-- ============================================================================

-- Drop duplicate btree index (file_hash already indexed by unique constraint songs_file_hash_key)
DROP INDEX IF EXISTS public.idx_songs_file_hash;

COMMIT;
