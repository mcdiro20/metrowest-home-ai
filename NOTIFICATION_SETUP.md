# Admin Notification Setup Guide

## Overview
Your app now sends you email notifications whenever:
1. Someone generates an AI renovation image
2. Someone fills out the contractor quote request form (marked as "Hot Lead")

## Required Setup Steps

### 1. Get a Resend API Key
1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Add Environment Variables to Vercel

Go to your Vercel dashboard and add these environment variables:

**Variable 1: RESEND_API_KEY**
- Name: `RESEND_API_KEY`
- Value: Your Resend API key (from step 1)
- Environment: Select all (Production, Preview, Development)

**Variable 2: ADMIN_NOTIFICATION_EMAIL**
- Name: `ADMIN_NOTIFICATION_EMAIL`
- Value: Your email address where you want to receive notifications
- Environment: Select all (Production, Preview, Development)

**Variable 3: SUPABASE_SERVICE_ROLE_KEY** (if not already added)
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `sb_secret_2s0qUwiCUUnXOs9wJ-K30w_mmRsZMD1`
- Environment: Select all (Production, Preview, Development)

### 3. Redeploy Your Application

After adding the environment variables:
1. Go to your Vercel project
2. Settings → Deployments
3. Find your latest deployment
4. Click the ⋯ menu
5. Click "Redeploy"
6. Wait for the deployment to complete

## Testing the Notifications

After redeploying:

1. Visit your production site
2. Upload an image and generate an AI renovation
3. Fill out your email in the form
4. You should receive a notification at your admin email

## What the Notifications Look Like

**AI Rendering Notification:**
- Subject: "🎨 New AI Rendering - [User Name/Email]"
- Contains: User contact info, project details, lead score
- Button to view in admin dashboard

**Contractor Form Notification:**
- Subject: "📋 New Contractor Quote Request - [User Name/Email]"
- Marked as "🔥 Hot Lead!"
- Contains: User contact info, project details, lead score
- Button to assign to contractor

## Troubleshooting

If notifications aren't working:

1. **Check Vercel Logs:**
   - Go to your Vercel project
   - Click on the latest deployment
   - Check "Functions" tab for logs
   - Look for "Admin notification" messages

2. **Verify Environment Variables:**
   - Make sure all 3 variables are set correctly
   - Make sure they're applied to "Production" environment
   - Variables should have no extra spaces

3. **Check Resend Dashboard:**
   - Log into Resend.com
   - Go to "Emails" section
   - See if any emails were sent (even if they bounced)
   - Check if you're within the free tier limits (100/day)

4. **Verify Email Address:**
   - Make sure `ADMIN_NOTIFICATION_EMAIL` is a valid email
   - Check your spam folder
   - Try a different email address if needed

## Debug Panel Access

The debug panel is now only visible to users with admin role. To make yourself an admin:

1. Sign up/login to your site
2. Go to your Supabase dashboard
3. Open the "profiles" table
4. Find your user record
5. Change the "role" field to "admin"
6. Refresh your site - you should now see the debug panel

## Additional Notes

- Notifications are sent in the background and won't slow down the user experience
- If email sending fails, it's logged but doesn't break the main flow
- All lead data is still saved to Supabase even if notifications fail
- The notification system works for both development and production environments
