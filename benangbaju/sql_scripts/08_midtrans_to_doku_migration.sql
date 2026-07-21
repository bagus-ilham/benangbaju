-- Migration script: Midtrans to DOKU Checkout
-- Rename columns in payments table to be gateway-agnostic

ALTER TABLE payments 
RENAME COLUMN midtrans_order_id TO gateway_order_id;

ALTER TABLE payments 
RENAME COLUMN midtrans_transaction_id TO gateway_transaction_id;

ALTER TABLE payments 
RENAME COLUMN midtrans_response TO gateway_response;
