# Supabase Setup Guide for CollabTOK

## Step 1: Create `.env.local` file

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholders with your actual Supabase credentials.

### Where to find your Supabase credentials:

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. You'll see:
   - **Project URL** → Copy this and paste it as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Copy this and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Your `.env.local` should look like this (with your actual values):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** After editing `.env.local`, you MUST restart your dev server:
- Stop the server (press `Ctrl+C` in the terminal)
- Run `npm run dev` again

## Step 2: Run SQL in Supabase

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire SQL block from `supabase-schema.sql` (or see below)
5. Click **Run** (or press `Ctrl+Enter`)

This will create all the necessary tables:
- `users` - User accounts
- `tiktok_profiles` - TikTok profile information
- `tiktok_stats` - TikTok statistics tracking
- `tiktok_videos` - TikTok video data

## Step 3: Test the Connection

1. Make sure your dev server is running: `npm run dev`
2. Open your browser and go to: `http://localhost:3000/api/supabase-test`
3. You should see a JSON response like:
   ```json
   {"ok":true,"userCount":0}
   ```

If you see `{"ok":true,"userCount":0}`, congratulations! Supabase is connected and working! 🎉

If you see an error, check:
- Did you restart the dev server after editing `.env.local`?
- Are your Supabase credentials correct in `.env.local`?
- Did you run the SQL schema in Supabase?

