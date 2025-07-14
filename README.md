# MetroWest Home AI

Transform your kitchen and backyard with AI-powered design renderings. Upload your photo and see what your space could become with MetroWest Home AI.

## Features

- 🏠 AI-powered home design transformations using DALL-E 3
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
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key for DALL-E 3 image generation
   - `RESEND_API_KEY`: Your Resend API key for email sending

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Deployment (Vercel + Resend + OpenAI)

#### Required API Keys:

1. **Get OpenAI API Key:**
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create API key (pay-per-use, ~$0.04 per DALL-E 3 image)

2. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Create API key (free tier: 3,000 emails/month)

#### Deploy to Vercel:

1. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables in Vercel:**
   - Go to your Vercel dashboard
   - Add environment variables:
     - `VITE_OPENAI_API_KEY`: Your OpenAI key
     - `RESEND_API_KEY`: Your Resend key

3. **Redeploy:**
   - Redeploy your site after adding environment variables

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

## Development vs Production

### Development Mode
- Uses demo images for AI generation (no OpenAI API calls)
- Stores email data in localStorage (no real emails sent)
- All features work for testing

### Production Mode
- Real DALL-E 3 API integration for AI image generation
- Real email sending via Resend
- Vercel serverless functions handle backend

## Cost Breakdown

### API Costs:
- **OpenAI DALL-E 3**: ~$0.04 per image generation
- **Resend**: Free tier (3,000 emails/month)
- **Vercel**: Free tier for hosting

### Estimated Monthly Costs:
- **0-100 users**: ~$5-15/month (mostly OpenAI)
- **100-500 users**: ~$20-50/month
- **500+ users**: Scale with usage

## Environment Variables

### Required for Production:
- `VITE_OPENAI_API_KEY`: OpenAI API key for DALL-E 3
- `RESEND_API_KEY`: Resend API key for emails

### Optional:
- Custom domain configuration
- Analytics tracking IDs

## Support

For questions about setup or deployment, check the documentation or create an issue.