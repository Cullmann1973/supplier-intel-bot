# Supplier Intel Bot

AI-powered supply chain intelligence platform that provides instant analysis on any supplier.

## Features

- **Real-time Intelligence**: Enter any supplier name and get comprehensive analysis
- **AI Analysis**: Powered by LLM for in-depth company insights
- **Risk Assessment**: Categorized risk factors (high/medium/low)
- **ESG Scoring**: Environmental, Social, and Governance metrics
- **Supply Chain Role**: Understanding of supplier's position in the value chain
- **Opportunities**: Strategic partnership and business opportunities
- **Certifications**: Quality and compliance certifications

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini or local Ollama models
- **Search**: Brave Search API (optional)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd supplier-intel-bot

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# OPENAI_API_KEY=your_key_here
# BRAVE_API_KEY=your_key_here (optional)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key for AI analysis |
| `BRAVE_API_KEY` | No | Brave Search API for real-time news |

*If no API keys are configured, the app falls back to local Ollama models (if available) or static demo data.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/supplier-intel-bot)

## API Architecture

The `/api/intel` endpoint:

1. **Web Search**: Searches for company news and information (if Brave API available)
2. **AI Analysis**: Sends context to LLM for comprehensive analysis
3. **Fallback Chain**: OpenAI → Ollama (local) → Static data

## Use Cases

- **Vendor Qualification**: Screen new suppliers before onboarding
- **Risk Monitoring**: Identify and track supplier risks
- **Strategic Sourcing**: Make data-driven procurement decisions
- **Due Diligence**: Support M&A and partnership evaluations

## Demo

Try these example suppliers:
- BASF SE
- Dow Chemical
- Honeywell
- Siemens AG
- 3M Company

## License

MIT

---

Built for supply chain excellence 🏭
