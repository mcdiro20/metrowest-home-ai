# How to Find AI Rendering Error Messages

## Browser Console (Frontend Errors)

1. **Open Browser Developer Tools:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K`
   - Safari: Enable Developer Menu in Preferences, then press `Cmd+Option+C`

2. **Go to the Console Tab**

3. **Look for these error messages:**
   - `❌ Premium rendering failed:` - Main error message
   - `❌ API Response not OK:` - HTTP error details
   - `❌ Error message:` - Specific error description
   - `❌ Error stack:` - Full error trace

4. **An alert box will also pop up with the error message**

## Vercel Function Logs (Backend Errors)

If you're deployed on Vercel:

1. **Go to your Vercel Dashboard:** https://vercel.com/dashboard
2. **Select your project**
3. **Click on "Functions" in the sidebar**
4. **Click on "Logs"**
5. **Look for these log messages:**
   - `🏛️ Architectural Vision Engine Request:` - Initial request
   - `🎯 Architectural Vision Engine parameters:` - Request details including prompt
   - `❌ Nano Banana error:` - Replicate API error
   - `❌ Architectural Vision Engine failed:` - Final error with full details

## Local Development

If running locally with `npm run dev`:

1. **Check the terminal where you ran `npm run dev`**
2. **Look for API logs starting with:**
   - `🏛️` (building emoji)
   - `❌` (X emoji) for errors
   - `✅` (checkmark) for success

## Common Issues to Look For

1. **Missing REPLICATE_API_TOKEN** - Should see: "No Replicate API token found"
2. **Prompt too long** - Prompt length shown in logs
3. **Image data format** - Check if base64 data is being sent correctly
4. **API rate limits** - Replicate may throttle requests
5. **Invalid model ID** - Nano Banana model might be unavailable

## What to Share with Developer

Copy and paste:
1. The full error message from the alert box
2. Console logs with `❌` symbols
3. The prompt length and first 200 characters of the prompt
4. Whether you see the "Using premium demo as fallback" message
