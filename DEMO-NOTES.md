# Supplier Intel Bot - Demo Notes

## Live Demo
**Local:** http://localhost:3000  
**Production:** (Deploy to Vercel for shareable link)

## Demo Flow

### 1. Landing Page
- Professional tagline: "Know Your Suppliers Before They Know You"
- Search input with quick-try buttons
- Feature highlights (Web Intel, Financial Health, Risk Assessment, Compliance)
- Use case cards (Vendor Qualification, Risk Monitoring, Strategic Sourcing)

### 2. Search a Supplier
Try these for impressive results:
- **BASF SE** - Large chemical company, rich data
- **Siemens AG** - Industrial conglomerate
- **Honeywell** - Diversified technology
- **3M Company** - Industrial/consumer products
- **Dow Chemical** - Chemical manufacturing

### 3. Intel Dashboard
Walk through each section:
- **Summary** - Executive overview
- **Quick Stats** - HQ, employees, revenue, founded, website
- **AI Analysis** - Deep insights about strengths, weaknesses, opportunities
- **Risk Assessment** - Color-coded HIGH/MEDIUM/LOW risks
- **ESG Score** - Visual gauge with Environmental/Social/Governance breakdown
- **Opportunities** - Strategic partnership possibilities
- **Certifications** - Quality and compliance certs
- **Supply Chain Role** - Where they fit in the value chain
- **Competitive Position** - Market standing

### 4. Actions
- **Export PDF** - Clean print layout
- **Share Link** - Copy URL to share

## Talking Points

### For Procurement/Supply Chain Leaders
- "Instant vendor qualification without weeks of research"
- "Real-time risk monitoring for your supplier base"
- "AI-powered insights that used to require expensive consultants"
- "ESG compliance visibility before onboarding"

### For IT/Digital Transformation
- "Modern API-first architecture"
- "Can integrate with existing ERP/SRM systems"
- "Scalable cloud deployment (Vercel/AWS/Azure)"
- "Multi-AI provider support (Anthropic, OpenAI, local Ollama)"

### For Executives
- "Reduce supplier risk exposure"
- "Accelerate vendor qualification from weeks to minutes"
- "Proactive vs reactive supply chain management"
- "Data-driven sourcing decisions"

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - Landing Page (search, features)                       │
│  - Intel Dashboard (results, visualizations)             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer (/api/intel)                │
│  - Web Search (Brave API - optional)                     │
│  - AI Analysis (Anthropic → OpenAI → Ollama)             │
│  - Response formatting                                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AI Providers                          │
│  1. Anthropic Claude (primary)                           │
│  2. OpenAI GPT-4o-mini (fallback)                        │
│  3. Local Ollama (offline fallback)                      │
└─────────────────────────────────────────────────────────┘
```

## Deployment Options

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Add env vars: ANTHROPIC_API_KEY or OPENAI_API_KEY
4. Deploy

### Self-Hosted
- Docker container ready
- Works with local Ollama for air-gapped environments

## Future Enhancements (Roadmap)

- [ ] Supplier comparison (side-by-side)
- [ ] Batch analysis (upload CSV)
- [ ] Alerts/monitoring for supplier changes
- [ ] Integration APIs (SAP, Oracle, Salesforce)
- [ ] Custom risk models
- [ ] Historical tracking
- [ ] Team collaboration features
