# Deploying CollabTOK to Vercel

Follow these steps to deploy your CollabTOK Next.js application to Vercel.

## Prerequisites

- Your code is pushed to GitHub at `https://github.com/sebinfosarl/collabtok`
- You have your Supabase credentials ready
- You have your TikTok Developer App credentials ready

---

## Step 1: Import Your Project to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Sign Up** or **Log In** (use your GitHub account)
3. Click **Add New** → **Project**
4. Import your `collabtok` repository from GitHub
5. Vercel will automatically detect it's a Next.js project

---

## Step 2: Configure Framework and Build Settings

Vercel should auto-detect these settings, but verify them in the project settings:

- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Development Command:** `npm run dev`
- **Output Directory:** (leave empty - Next.js App Router doesn't need a custom output directory)

These are the default values for a Next.js App Router application, so Vercel should set them automatically.

---

## Step 3: Add Environment Variables

Before deploying, you **must** add all required environment variables. Click **Environment Variables** in your Vercel project settings and add each of these:

### Required Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - **What it is:** Your Supabase project URL
   - **Type:** Public (exposed to browser)
   - **Where to get it:** Supabase Dashboard → Settings → API → Project URL
   - **Example:** `https://xxxxxxxxxxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - **What it is:** Your Supabase anonymous/public API key
   - **Type:** Public (exposed to browser)
   - **Where to get it:** Supabase Dashboard → Settings → API → anon public key
   - **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **TIKTOK_CLIENT_KEY**
   - **What it is:** Your TikTok Developer App Client Key
   - **Type:** Server only (not exposed to browser)
   - **Where to get it:** TikTok Developer Portal → Your App → Basic Information → Client Key

4. **TIKTOK_REDIRECT_URI**
   - **What it is:** The callback URL where TikTok redirects after authentication
   - **Type:** Server only (not exposed to browser)
   - **Where to get it:** You'll set this after deployment (see Step 5)
   - **Format:** `https://your-app.vercel.app/api/auth/tiktok/callback`
   - **⚠️ Important:** Add this temporarily for now (use a placeholder), then update it in Step 5 with your actual Vercel URL

5. **TIKTOK_CLIENT_SECRET** (if implementing OAuth callback)
   - **What it is:** Your TikTok Developer App Client Secret (for exchanging authorization codes)
   - **Type:** Server only (not exposed to browser)
   - **Where to get it:** TikTok Developer Portal → Your App → Basic Information → Client Secret
   - **Note:** This is required if you plan to implement the OAuth callback route to exchange authorization codes for access tokens

---

## Step 4: Deploy Your Application

1. After adding all environment variables, click **Deploy**
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployment is successful, Vercel will show you your live URL
4. Your app will be available at: `https://your-app-name.vercel.app` (or a custom domain if you set one up)

**🎉 Congratulations! Your app is now live!**

---

## Step 5: Update TikTok App Settings

After deployment, you need to update your TikTok Developer App settings with your production URLs:

1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Log in and select your app
3. Go to **Basic Information** or **Platform Settings**
4. Update the following settings:

   **Web/Desktop URL:**
   ```
   https://your-app-name.vercel.app
   ```
   (Replace `your-app-name` with your actual Vercel app name)

   **Redirect URI:**
   ```
   https://your-app-name.vercel.app/api/auth/tiktok/callback
   ```
   (This must match exactly what you set in `TIKTOK_REDIRECT_URI` environment variable)

5. Save the changes in TikTok Developer Portal
6. **Important:** Also update the `TIKTOK_REDIRECT_URI` environment variable in Vercel to match your production URL:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Edit `TIKTOK_REDIRECT_URI` to: `https://your-app-name.vercel.app/api/auth/tiktok/callback`
   - Redeploy the application (Vercel will automatically redeploy when you update environment variables)

---

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify your `package.json` has the correct build script
- Check the Vercel build logs for specific error messages

### TikTok OAuth Not Working
- Verify `TIKTOK_REDIRECT_URI` in Vercel matches exactly what's configured in TikTok Developer Portal
- Check that your TikTok app is approved and not in development mode restrictions
- Ensure `TIKTOK_CLIENT_KEY` is correct

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active and not paused
- Test the connection using `/api/supabase-test` on your live site

---

## Additional Notes

- Vercel automatically deploys new commits to your main branch (you can configure this in settings)
- Environment variables can be different for Preview, Development, and Production environments
- For production, always use the Production environment settings when adding environment variables
- Remember to keep your secrets secure and never commit them to GitHub

---

**Need Help?**

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/tiktok-login-kit-web/)
- [Supabase Documentation](https://supabase.com/docs)

