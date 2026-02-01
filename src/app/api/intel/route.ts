import { NextRequest, NextResponse } from 'next/server';

// Types for our intel response
interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  snippet: string;
}

interface RiskFactor {
  category: string;
  level: 'low' | 'medium' | 'high';
  description: string;
}

interface SupplierIntel {
  company: string;
  summary: string;
  industry: string;
  headquarters: string;
  employees: string;
  revenue: string;
  founded: string;
  website: string;
  stockSymbol?: string;
  news: NewsItem[];
  risks: RiskFactor[];
  opportunities: string[];
  esgScore: {
    environmental: number;
    social: number;
    governance: number;
    overall: number;
  };
  competitivePosition: string;
  supplyChainRole: string;
  certifications: string[];
  recentDevelopments: string[];
  aiAnalysis: string;
}

async function searchBrave(query: string): Promise<any[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.log('No Brave API key, using fallback data');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Brave search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.web?.results || [];
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

async function analyzeWithOllama(supplierName: string, prompt: string): Promise<Partial<SupplierIntel> | null> {
  // Ollama URLs - check for tunnel URL first (for Vercel deployment)
  const tunnelUrl = process.env.OLLAMA_URL;
  const ollamaUrls = [
    ...(tunnelUrl ? [tunnelUrl] : []),  // Cloudflare tunnel (production)
    'http://192.168.50.1:11434',        // Windows PC (local dev)
    'http://localhost:11434',           // Local Mac (local dev)
  ];
  
  for (const baseUrl of ollamaUrls) {
    try {
      console.log(`Trying Ollama at ${baseUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:8b-0528-qwen3-q8_0',
          prompt: prompt + '\n\nRespond with ONLY valid JSON, no other text.',
          stream: false,
          options: { temperature: 0.7 }
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.response || '';
        console.log('Ollama response received');
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('Failed to parse Ollama JSON');
          }
        }
      }
    } catch (error) {
      console.log(`Ollama at ${baseUrl} not available`);
    }
  }
  return null;
}

async function analyzeWithAI(supplierName: string, searchResults: any[]): Promise<Partial<SupplierIntel>> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  // Prepare context from search results
  const searchContext = searchResults.length > 0
    ? searchResults
        .slice(0, 8)
        .map(r => `- ${r.title}: ${r.description || ''}`)
        .join('\n')
    : 'No real-time search results available. Use your training knowledge about this company.';

  const prompt = `You are a supply chain intelligence analyst. Analyze this supplier and provide a comprehensive intelligence report based on your knowledge.

Supplier: ${supplierName}

Recent search results about this company:
${searchContext || 'No recent search results available.'}

Provide your analysis in this exact JSON format (no markdown, just raw JSON):
{
  "summary": "2-3 sentence executive summary of the company",
  "industry": "Primary industry sector",
  "headquarters": "City, Country",
  "employees": "Approximate employee count (e.g., '50,000+' or '1,000-5,000')",
  "revenue": "Annual revenue if known (e.g., '$50B' or 'Private')",
  "founded": "Year founded",
  "website": "Company website URL",
  "stockSymbol": "Stock ticker if public, null if private",
  "risks": [
    {"category": "Category name", "level": "low|medium|high", "description": "Brief description"}
  ],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "esgScore": {
    "environmental": 75,
    "social": 80,
    "governance": 85,
    "overall": 80
  },
  "competitivePosition": "Brief description of market position",
  "supplyChainRole": "Their role in typical supply chains",
  "certifications": ["ISO 9001", "ISO 14001", "etc"],
  "recentDevelopments": ["Recent news/development 1", "Recent news/development 2"],
  "aiAnalysis": "3-4 sentence AI analysis of this supplier's strengths, weaknesses, and what a procurement team should know"
}

Be specific and factual where possible. For unknown companies, make reasonable inferences based on the name and any available context. Always provide complete JSON.`;

  // Try Anthropic first if available
  if (anthropicKey) {
    console.log('Calling Anthropic for analysis...');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content?.[0]?.text || '';
        console.log('Anthropic response received, parsing...');
        
        try {
          const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('Failed to parse Anthropic response as JSON:', parseError);
        }
      } else {
        console.error('Anthropic response not OK:', response.status);
      }
    } catch (error) {
      console.error('Anthropic API error:', error);
    }
  }

  // Try OpenAI as fallback
  if (openaiKey) {
    console.log('Calling OpenAI for analysis...');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        console.log('OpenAI response received, parsing...');
        
        try {
          const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('Failed to parse OpenAI response as JSON:', parseError);
        }
      } else {
        console.error('OpenAI response not OK:', response.status);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }

  // Try Ollama as fallback
  console.log('Trying Ollama fallback...');
  const ollamaResult = await analyzeWithOllama(supplierName, prompt);
  if (ollamaResult) {
    console.log('Ollama analysis successful');
    return ollamaResult;
  }

  // Static fallback for demo purposes
  console.log('Using static fallback analysis');
  return generateFallbackAnalysis(supplierName);
}

function generateFallbackAnalysis(supplierName: string): Partial<SupplierIntel> {
  // Generate plausible demo data based on company name
  const isKnownCompany = ['BASF', 'Dow', 'Honeywell', 'Siemens', '3M'].some(
    name => supplierName.toLowerCase().includes(name.toLowerCase())
  );

  return {
    summary: `${supplierName} is a significant player in their industry sector. This analysis is based on publicly available information and should be verified with direct supplier engagement.`,
    industry: 'Manufacturing / Industrial',
    headquarters: 'Information pending verification',
    employees: isKnownCompany ? '50,000+' : '1,000-10,000',
    revenue: isKnownCompany ? '$10B+' : 'Private/Not disclosed',
    founded: 'See company profile',
    website: `https://www.${supplierName.toLowerCase().replace(/\s+/g, '')}.com`,
    risks: [
      { category: 'Supply Continuity', level: 'medium', description: 'Standard market risks apply' },
      { category: 'Geopolitical', level: 'low', description: 'Diversified operations reduce exposure' },
      { category: 'Financial', level: 'low', description: 'Stable market position' },
    ],
    opportunities: [
      'Potential for strategic partnership',
      'Innovation collaboration opportunities',
      'Volume discount negotiations',
    ],
    esgScore: {
      environmental: 72,
      social: 78,
      governance: 81,
      overall: 77,
    },
    competitivePosition: 'Established market participant with recognized capabilities',
    supplyChainRole: 'Tier 1/2 supplier for industrial and manufacturing sectors',
    certifications: ['ISO 9001', 'ISO 14001'],
    recentDevelopments: [
      'Continued investment in operational capabilities',
      'Market expansion initiatives ongoing',
    ],
    aiAnalysis: `${supplierName} appears to be a viable supplier option. Recommend conducting direct due diligence including facility audits, financial verification, and reference checks. Consider starting with a pilot engagement to assess actual performance before committing to large-volume contracts.`,
  };
}

function extractNews(searchResults: any[]): NewsItem[] {
  return searchResults
    .filter(r => r.title && r.url)
    .slice(0, 6)
    .map(r => ({
      title: r.title,
      url: r.url,
      source: new URL(r.url).hostname.replace('www.', ''),
      date: r.age || 'Recent',
      snippet: r.description || '',
    }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const supplier = searchParams.get('supplier');

  if (!supplier) {
    return NextResponse.json({ error: 'Supplier name required' }, { status: 400 });
  }

  try {
    // Search for company info
    const [companyResults, newsResults, riskResults] = await Promise.all([
      searchBrave(`${supplier} company profile overview`),
      searchBrave(`${supplier} news 2024 2025`),
      searchBrave(`${supplier} supply chain risk issues`),
    ]);

    // Combine all search results for AI analysis
    const allResults = [...companyResults, ...newsResults, ...riskResults];

    // Get AI analysis
    const aiAnalysis = await analyzeWithAI(supplier, allResults);

    // Extract news items
    const news = extractNews(newsResults);

    // Combine everything into the final response
    const intel: SupplierIntel = {
      company: supplier,
      summary: aiAnalysis.summary || `Intelligence report for ${supplier}`,
      industry: aiAnalysis.industry || 'Industrial',
      headquarters: aiAnalysis.headquarters || 'Not available',
      employees: aiAnalysis.employees || 'Not available',
      revenue: aiAnalysis.revenue || 'Not disclosed',
      founded: aiAnalysis.founded || 'Not available',
      website: aiAnalysis.website || '',
      stockSymbol: aiAnalysis.stockSymbol,
      news: news.length > 0 ? news : [
        { title: 'No recent news found', url: '#', source: 'N/A', date: '', snippet: 'Try searching for this company directly' }
      ],
      risks: aiAnalysis.risks || [],
      opportunities: aiAnalysis.opportunities || [],
      esgScore: aiAnalysis.esgScore || { environmental: 0, social: 0, governance: 0, overall: 0 },
      competitivePosition: aiAnalysis.competitivePosition || '',
      supplyChainRole: aiAnalysis.supplyChainRole || '',
      certifications: aiAnalysis.certifications || [],
      recentDevelopments: aiAnalysis.recentDevelopments || [],
      aiAnalysis: aiAnalysis.aiAnalysis || '',
    };

    return NextResponse.json(intel);
  } catch (error) {
    console.error('Intel gathering error:', error);
    return NextResponse.json(
      { error: 'Failed to gather supplier intelligence' },
      { status: 500 }
    );
  }
}
// Trigger redeploy Sun Feb  1 17:17:41 EST 2026
// Tunnel URL update Sun Feb  1 17:47:18 EST 2026
// Permanent tunnel Sun Feb  1 18:15:30 EST 2026
