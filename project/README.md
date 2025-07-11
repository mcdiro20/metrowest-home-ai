# MetroWest Home AI

Transform your kitchen and backyard with AI-powered design renderings. Upload your photo and see what your space could become with MetroWest Home AI.

## Features

- 🏠 AI-powered home design transformations
- 🎨 Multiple design styles (Modern Minimalist, Farmhouse Chic, etc.)
- 📧 Email delivery of high-resolution before/after images
- 🏘️ Exclusively for MetroWest Massachusetts homeowners
- 💼 Connect with local contractors

## Setup

### Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key for image generation
   - `RESEND_API_KEY`: Your Resend API key for email sending

3. **Start development server:**
   ```bash
   npm run dev
   ```

   **Note**: In development mode, email sending is simulated and stored in localStorage. For testing the actual email API locally, you would need to run `vercel dev` in a separate terminal, but this is not required for basic development and testing.

### Production Deployment (Vercel + Resend)

#### Cost: **FREE** for starter usage
- Vercel: Free tier (100GB bandwidth)
- Resend: Free tier (3,000 emails/month)

#### Setup Steps:

1. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Create API key (free tier: 3,000 emails/month)
   - Verify your domain or use their test domain

2. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Set Environment Variables in Vercel:**
   - Go to your Vercel dashboard
   - Add environment variables:
     - `VITE_OPENAI_API_KEY`: Your OpenAI key
     - `RESEND_API_KEY`: Your Resend key

4. **Configure Domain (Optional):**
   - Add your custom domain in Vercel
   - Update Resend domain settings

## Email Service Options

### 1. Vercel + Resend (Recommended - FREE)
- **Cost**: $0/month for 3,000 emails
- **Setup**: Included in this project
- **Pros**: Excellent deliverability, simple setup

### 2. Netlify + EmailJS (Alternative - FREE)
- **Cost**: $0/month for 200 emails
- **Setup**: Client-side email sending
- **Pros**: No backend required

### 3. Railway + Gmail SMTP (Budget Option)
- **Cost**: ~$5/month hosting
- **Setup**: Node.js backend with Nodemailer
- **Pros**: More control, higher limits

## API Endpoints

### POST /api/send-email
Send AI-generated design images via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "beforeImage": "data:image/jpeg;base64,...",
  "afterImage": "https://example.com/after.jpg",
  "selectedStyle": "Modern Minimalist",
  "roomType": "kitchen",
  "subscribe": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Design images sent successfully!",
  "emailId": "email_123456789"
}
```

## Architecture

```
Frontend (React + Vite)
├── AI Image Generation (OpenAI DALL-E)
├── Style Selection Modal
├── Email Collection
└── API Integration

Backend (Vercel Serverless)
├── /api/send-email
├── Email Templates (HTML)
└── Resend Integration

Email Service (Resend)
├── Transactional Emails
├── Newsletter Management
└── Delivery Analytics
```

## Development vs Production

### Development Mode
- Uses demo images for AI generation
- Stores email data in localStorage
- Simulates email sending

### Production Mode
- Real OpenAI API integration
- Vercel serverless functions
- Resend email delivery
- Analytics and tracking

## Cost Breakdown

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, 100 serverless function executions/day
- **Resend**: 3,000 emails/month, 100 emails/day
- **OpenAI**: Pay-per-use (~$0.04 per image)

### Estimated Monthly Costs:
- **0-100 users**: $0/month (free tiers)
- **100-1000 users**: ~$10-20/month (mostly OpenAI costs)
- **1000+ users**: Scale with usage-based pricing

## Support

For questions about setup or deployment, check the documentation or create an issue.