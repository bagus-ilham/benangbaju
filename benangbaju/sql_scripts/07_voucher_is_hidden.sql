-- Migration: Add is_hidden column to vouchers table
-- Description: Allows vouchers to be active but hidden from the public list in checkout.

ALTER TABLE vouchers ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;
