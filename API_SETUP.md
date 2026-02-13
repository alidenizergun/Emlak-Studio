# API Configuration Setup

## Required: Gemini API Key

To enable AI features on the **Stage** and **Enhance** pages, you need to configure your Google Gemini API key.

### Getting Your API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### Setting Up the Environment

1. Open `.env.local` file in the project root
2. Replace `your_gemini_api_key_here` with your actual API key:

```bash
GEMINI_API_KEY=AIzaSyD...your_actual_key
```

3. Restart the development server:

```bash
npm run dev
```

### Verification

After setting up the API key:
- Navigate to `/stage` page
- Upload an empty room photo
- Select room type and style
- Click "Sanal Dekorasyon Oluştur"
- The AI should process and return a furnished version

If you see an "API anahtarı ayarlanmamış" error, check that:
1. `.env.local` file exists in project root
2. The API key is correctly set
3. The development server was restarted after adding the key

### Cost & Limits

- Gemini API has a free tier with rate limits
- Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)
- Each image processing request counts toward your quota

### Security Note

**IMPORTANT**: 
- Never commit `.env.local` to version control
- The file is already in `.gitignore`
- Keep your API key private
