-- CollabTOK Database Schema
-- Run this entire SQL block in Supabase SQL Editor

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- TikTok Profiles table
CREATE TABLE IF NOT EXISTS tiktok_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tiktok_username TEXT UNIQUE NOT NULL,
  tiktok_display_name TEXT,
  profile_picture_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- TikTok Stats table (for tracking statistics over time)
CREATE TABLE IF NOT EXISTS tiktok_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- TikTok Videos table
CREATE TABLE IF NOT EXISTS tiktok_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT UNIQUE NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  video_created_at TIMESTAMPTZ -- when the video was posted on TikTok
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tiktok_profiles_user_id ON tiktok_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_profiles_tiktok_username ON tiktok_profiles(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_tiktok_stats_user_id ON tiktok_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_stats_recorded_at ON tiktok_stats(recorded_at);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_user_id ON tiktok_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_video_id ON tiktok_videos(video_id);

-- Enable Row Level Security (RLS) - you can customize these policies later
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all for now - you'll customize these later)
-- Users can read all users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can insert their own user record
CREATE POLICY "Users can insert their own user" ON users
  FOR INSERT WITH CHECK (true);

-- Users can update their own user record
CREATE POLICY "Users can update their own user" ON users
  FOR UPDATE USING (true);

-- Similar policies for other tables (you can customize these later)
CREATE POLICY "TikTok profiles are viewable by everyone" ON tiktok_profiles
  FOR SELECT USING (true);

CREATE POLICY "TikTok profiles can be inserted by authenticated users" ON tiktok_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "TikTok stats are viewable by everyone" ON tiktok_stats
  FOR SELECT USING (true);

CREATE POLICY "TikTok stats can be inserted by authenticated users" ON tiktok_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "TikTok videos are viewable by everyone" ON tiktok_videos
  FOR SELECT USING (true);

CREATE POLICY "TikTok videos can be inserted by authenticated users" ON tiktok_videos
  FOR INSERT WITH CHECK (true);

