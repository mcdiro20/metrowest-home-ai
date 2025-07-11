# 🚀 Deploy MetroWest Home AI to Vercel

## What You'll Need (5 minutes to get these):
1. **Vercel Account** (free) - Sign up at vercel.com
2. **OpenAI API Key** (paid) - Get from platform.openai.com
3. **Resend API Key** (free) - Get from resend.com

---

## Step 1: Get Your API Keys

### Get OpenAI API Key (Required for AI image generation):
1. Go to https://platform.openai.com
2. Sign up or log in
3. Click "API Keys" in the left menu
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Save it somewhere safe** - you'll need it later

### Get Resend API Key (Required for sending emails):
1. Go to https://resend.com
2. Sign up with your email
3. Click "API Keys" in the dashboard
4. Click "Create API Key"
5. Copy the key (starts with `re_`)
6. **Save it somewhere safe** - you'll need it later

---

## Step 2: Download Your Project Files

1. **In this Bolt window**, look for a **Download** or **Export** button
2. Download all your project files as a ZIP
3. **Unzip the files** to a folder on your computer (like Desktop/metrowest-home-ai)

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel Website (Easiest)
1. Go to https://vercel.com
2. Click "Sign Up" (use GitHub, Google, or email)
3. Once logged in, click "Add New..." → "Project"
4. Click "Browse" and select your unzipped project folder
5. Click "Deploy"
6. Wait for deployment to finish (2-3 minutes)

### Option B: Using Command Line (If you're comfortable)
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Type: `npm install -g vercel`
3. Navigate to your project folder
4. Type: `vercel`
5. Follow the prompts

---

## Step 4: Add Your API Keys to Vercel

1. **In your Vercel dashboard**, click on your deployed project
2. Click the "Settings" tab
3. Click "Environment Variables" in the left menu
4. Add these two variables:

   **Variable 1:**
   - Name: `VITE_OPENAI_API_KEY`
   - Value: Your OpenAI key (the one starting with `sk-`)
   
   **Variable 2:**
   - Name: `RESEND_API_KEY`
   - Value: Your Resend key (the one starting with `re_`)

5. Click "Save" for each one

---

## Step 5: Redeploy (Important!)

1. Go back to your project dashboard
2. Click the "Deployments" tab
3. Click the "..." menu on the latest deployment
4. Click "Redeploy"
5. Wait for it to finish

---

## Step 6: Test Your Live App! 🎉

1. **Click your Vercel URL** (looks like: https://your-app-name.vercel.app)
2. **Test the full flow:**
   - Enter a MetroWest ZIP code (like 01701)
   - Upload a kitchen or backyard photo
   - Select a design style
   - Wait for AI processing
   - Enter your email address
   - **Check your email inbox!** 📧

---

## ✅ Success Checklist

- [ ] Got OpenAI API key
- [ ] Got Resend API key  
- [ ] Downloaded project files
- [ ] Deployed to Vercel
- [ ] Added environment variables
- [ ] Redeployed
- [ ] Tested with real email

---

## 🆘 If Something Goes Wrong

### "AI processing failed"
- Check that your OpenAI API key is correct
- Make sure you have credits in your OpenAI account

### "Email not received"
- Check spam/junk folder
- Verify Resend API key is correct
- Make sure you redeployed after adding environment variables

### "ZIP code not accepted"
- Use a MetroWest MA ZIP code like: 01701, 01702, 01720, 01730

---

## 💰 Costs

- **Vercel**: Free (for your usage level)
- **Resend**: Free (3,000 emails/month)
- **OpenAI**: ~$0.04 per AI image generated

**Total monthly cost for moderate usage: $5-15**

---

## 🎯 Your Live App URL

After deployment, your app will be live at:
`https://your-project-name.vercel.app`

Share this URL with friends and family in MetroWest to try it out!