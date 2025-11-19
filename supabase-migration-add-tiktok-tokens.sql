-- Migration: Add TikTok tokens table for storing access tokens
-- Run this in Supabase SQL Editor

-- Create tiktok_tokens table to store access tokens for automatic syncing
CREATE TABLE IF NOT EXISTS tiktok_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tiktok_tokens_user_id ON tiktok_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_tokens_expires_at ON tiktok_tokens(expires_at);

-- Enable RLS
ALTER TABLE tiktok_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "TikTok tokens are viewable by everyone" ON tiktok_tokens
  FOR SELECT USING (true);

CREATE POLICY "TikTok tokens can be inserted by authenticated users" ON tiktok_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "TikTok tokens can be updated by authenticated users" ON tiktok_tokens
  FOR UPDATE USING (true);

