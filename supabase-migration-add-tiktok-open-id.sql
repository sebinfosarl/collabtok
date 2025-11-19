-- Migration: Add tiktok_open_id column to users table
-- Run this in Supabase SQL Editor if the column doesn't exist

-- Add tiktok_open_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_open_id TEXT UNIQUE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_tiktok_open_id ON users(tiktok_open_id);

