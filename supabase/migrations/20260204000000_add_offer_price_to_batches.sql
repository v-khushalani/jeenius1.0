-- Add offer_price column to batches table
-- Migration: 20260204000000_add_offer_price_to_batches.sql

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS offer_price INTEGER DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.batches.offer_price IS 'Discounted price in paise (for sale/promotion). If NULL, use regular price.';

-- Create index for filtering batches by price
CREATE INDEX IF NOT EXISTS idx_batches_price ON public.batches(price);
CREATE INDEX IF NOT EXISTS idx_batches_offer_price ON public.batches(offer_price);
