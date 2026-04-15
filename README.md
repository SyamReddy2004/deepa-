# 🌾 AgroMind AI

AI-powered farming intelligence platform for Indian farmers.

## Features

- 📊 **Dashboard** — Live stats, quick actions, activity feed, daily farming tips
- 🌱 **Soil Analysis** — GPS + image upload + AI soil type, pH, NPK, crop recommendations
- 🌾 **Crop Advisor** — ML-powered top 5 crop recommendations with yield & revenue estimates
- 🍃 **Disease Detection** — Upload leaf photo + symptom description → AI diagnosis + treatment
- 🌤️ **Weather Module** — GPS auto-detect or city search → 5-day forecast + farming advice
- 🤖 **AI Chatbot** — Multilingual (English, Hindi, Kannada, Telugu, Tamil) + voice input/output

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Claude API (claude-sonnet-4-20250514)
- **Features**: Web Speech API, Geolocation API, FileReader API

## Quick Deploy to Vercel

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/agromind-ai.git
cd agromind-ai
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
```

Get your API key from: https://console.anthropic.com

### 3. Run locally

```bash
npm install -g vercel
vercel dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

**Option A — CLI:**
```bash
vercel --prod
```

**Option B — GitHub (recommended):**
1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Click Deploy ✓

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | ✅ Yes |

Set this in Vercel → Project Settings → Environment Variables.

## Project Structure

```
agromind/
├── api/
│   └── chat.js          # Vercel serverless proxy (keeps API key secure)
├── src/
│   ├── App.jsx          # Full React application
│   └── main.jsx         # React entry point
├── public/
│   └── favicon.svg
├── index.html           # HTML shell with CSS variables (light + dark mode)
├── vite.config.js
├── vercel.json
├── package.json
├── .env.example         # Template — copy to .env.local
└── .gitignore
```

## Browser Support

| Feature | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| Core AI features | ✅ | ✅ | ✅ | ✅ |
| GPS detection | ✅ | ✅ | ✅ | ✅ |
| Image upload | ✅ | ✅ | ✅ | ✅ |
| Voice input 🎙️ | ✅ | ✅ | ❌ | ❌ |
| Voice output 🔊 | ✅ | ✅ | ✅ | ✅ |

> Voice input uses Web Speech API — Chrome/Edge only. All other features work in all browsers.

## Dataset Links (for ML model training)

| Dataset | Type | Link |
|---|---|---|
| PlantVillage | Leaf Disease (54K images) | https://www.kaggle.com/datasets/emmarex/plantdisease |
| Crop Recommendation | Soil + NPK (2.2K samples) | https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset |
| Soil Types | Soil Images (3K+) | https://www.kaggle.com/datasets/prasanshasatpathy/soil-types |
| Weather History | Climate Data | https://www.kaggle.com/datasets/muthuj7/weather-dataset |

## License

MIT
