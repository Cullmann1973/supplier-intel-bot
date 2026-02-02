import { NextRequest, NextResponse } from 'next/server';
import { getESGScore, analyzeReputationWithAI, searchEmployeeReviews } from './esg-reputation';

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

interface ReputationIssue {
  source: string;
  type: 'consumer' | 'reddit' | 'news' | 'regulatory';
  severity: 'minor' | 'moderate' | 'severe';
  title: string;
  snippet: string;
  url: string;
  date?: string;
}

interface ReputationScore {
  overall: number; // 0-100
  consumerSentiment: number;
  socialMediaSentiment: number;
  mediaSentiment: number;
  regulatoryCompliance: number;
  issues: ReputationIssue[];
  summary: string;
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
    source?: string;
    confidence?: string;
    riskLevel?: string;
  };
  competitivePosition: string;
  supplyChainRole: string;
  certifications: string[];
  recentDevelopments: string[];
  aiAnalysis: string;
  reputation: ReputationScore;
}

async function searchWeb(query: string): Promise<any[]> {
  // Try Serper.dev first (free tier available)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        if (results.length > 0) {
          console.log(`Serper returned ${results.length} results for: ${query}`);
          return results.map((r: any) => ({
            title: r.title,
            url: r.link,
            description: r.snippet,
            age: r.date || 'Recent',
          }));
        }
      }
    } catch (error) {
      console.error('Serper search error:', error);
    }
  }

  // Try Brave API
  const braveKey = process.env.BRAVE_API_KEY;
  if (braveKey) {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': braveKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = data.web?.results || [];
        if (results.length > 0) {
          console.log(`Brave returned ${results.length} results for: ${query}`);
          return results;
        }
      }
    } catch (error) {
      console.error('Brave search error:', error);
    }
  }

  // Fallback: DuckDuckGo (free, no key required)
  try {
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    
    if (ddgResponse.ok) {
      const data = await ddgResponse.json();
      const results: any[] = [];
      
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          description: data.Abstract,
          age: 'Recent',
        });
      }
      
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 8).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              url: topic.FirstURL,
              description: topic.Text,
              age: 'Recent',
            });
          }
        });
      }
      
      if (results.length > 0) {
        console.log(`DuckDuckGo returned ${results.length} results for: ${query}`);
        return results;
      }
    }
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
  }

  console.log('No search results for:', query);
  return [];
}

// Backwards compatibility alias
async function searchBrave(query: string): Promise<any[]> {
  return searchWeb(query);
}

// Google News RSS - FREE, no API key required!
async function searchGoogleNews(query: string): Promise<any[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    console.log(`Fetching Google News RSS for: ${query}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SupplierIntelBot/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error('Google News RSS error:', response.status);
      return [];
    }
    
    const xml = await response.text();
    const results: any[] = [];
    
    // Parse RSS XML (simple regex parsing for <item> elements)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source[^>]*>(.*?)<\/source>/;
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null && results.length < 10) {
      const item = match[1];
      
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const dateMatch = item.match(pubDateRegex);
      const sourceMatch = item.match(sourceRegex);
      
      if (titleMatch && linkMatch) {
        const title = (titleMatch[1] || titleMatch[2] || '').trim();
        const link = linkMatch[1].trim();
        const pubDate = dateMatch ? dateMatch[1].trim() : '';
        const source = sourceMatch ? sourceMatch[1].trim() : '';
        
        // Parse the date to relative time
        let age = 'Recent';
        if (pubDate) {
          const date = new Date(pubDate);
          const now = new Date();
          const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
          if (diffHours < 1) age = 'Just now';
          else if (diffHours < 24) age = `${diffHours} hours ago`;
          else if (diffHours < 48) age = 'Yesterday';
          else age = `${Math.floor(diffHours / 24)} days ago`;
        }
        
        results.push({
          title: title.replace(/ - .*$/, ''), // Remove source suffix from title
          url: link,
          description: `News from ${source || 'Google News'}`,
          source: source || 'Google News',
          age,
        });
      }
    }
    
    console.log(`Google News returned ${results.length} results for: ${query}`);
    return results;
  } catch (error) {
    console.error('Google News RSS error:', error);
    return [];
  }
}

async function analyzeWithOllama(supplierName: string, prompt: string): Promise<Partial<SupplierIntel> | null> {
  // Ollama URLs - check local first, then tunnel for remote
  const tunnelUrl = process.env.OLLAMA_URL;
  const ollamaUrls = [
    'http://127.0.0.1:11434',           // Local Mac (priority)
    'http://localhost:11434',           // Local Mac alternate
    'http://192.168.50.1:11434',        // Windows PC (local network)
    ...(tunnelUrl ? [tunnelUrl] : []),  // Cloudflare tunnel (production)
  ];
  
  // Try to detect which model is available
  const preferredModels = [
    'qwen3:30b-a3b',                    // Mac local model (MoE, fast)
    'qwen3-coder:30b',                  // Windows PC model
    'deepseek-r1:8b-0528-qwen3-q8_0',   // Fallback
  ];
  
  for (const baseUrl of ollamaUrls) {
    try {
      console.log(`Trying Ollama at ${baseUrl}...`);
      
      // First check which models are available
      const tagsRes = await fetch(`${baseUrl}/api/tags`, { 
        signal: AbortSignal.timeout(3000) 
      });
      
      if (!tagsRes.ok) continue;
      
      const tagsData = await tagsRes.json();
      const availableModels = tagsData.models?.map((m: any) => m.name) || [];
      
      // Pick the best available model
      const modelToUse = preferredModels.find(m => availableModels.includes(m)) || availableModels[0];
      if (!modelToUse) continue;
      
      console.log(`Using model: ${modelToUse}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt: prompt + '\n\nRespond with ONLY valid JSON, no other text. Do not include any thinking or explanation.',
          stream: false,
          options: { 
            temperature: 0.7,
            num_predict: 1500,
          }
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        let content = data.response || '';
        console.log('Ollama response received');
        
        // Clean up thinking tags if present
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        
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
  const groqKey = process.env.GROQ_API_KEY;
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

  // Try Groq first (free and fast)
  if (groqKey) {
    console.log('Calling Groq for analysis...');
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        console.log('Groq response received, parsing...');
        
        try {
          const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('Failed to parse Groq response as JSON:', parseError);
        }
      } else {
        console.error('Groq response not OK:', response.status);
      }
    } catch (error) {
      console.error('Groq API error:', error);
    }
  }

  // Try Anthropic if available
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

async function analyzeReputation(
  supplierName: string, 
  consumerResults: any[], 
  redditResults: any[], 
  negativeNewsResults: any[], 
  regulatoryResults: any[]
): Promise<ReputationScore> {
  const issues: ReputationIssue[] = [];
  
  // Negative keywords for sentiment detection
  const severeKeywords = ['lawsuit', 'fraud', 'scandal', 'recall', 'death', 'injury', 'criminal', 'violation', 'fine', 'penalty', 'banned', 'shutdown'];
  const moderateKeywords = ['complaint', 'problem', 'issue', 'warning', 'concern', 'investigation', 'audit', 'dispute', 'criticism', 'controversy'];
  const minorKeywords = ['delay', 'late', 'slow', 'disappointed', 'frustrating', 'annoying'];

  const detectSeverity = (text: string): 'minor' | 'moderate' | 'severe' => {
    const lower = text.toLowerCase();
    if (severeKeywords.some(k => lower.includes(k))) return 'severe';
    if (moderateKeywords.some(k => lower.includes(k))) return 'moderate';
    return 'minor';
  };

  // Process consumer feedback
  consumerResults.slice(0, 5).forEach(r => {
    const text = `${r.title} ${r.description || ''}`;
    const severity = detectSeverity(text);
    if (severity !== 'minor' || text.toLowerCase().includes('complaint') || text.toLowerCase().includes('review')) {
      issues.push({
        source: new URL(r.url).hostname.replace('www.', ''),
        type: 'consumer',
        severity,
        title: r.title,
        snippet: r.description || '',
        url: r.url,
        date: r.age || 'Recent'
      });
    }
  });

  // Process Reddit discussions
  redditResults.slice(0, 5).forEach(r => {
    const text = `${r.title} ${r.description || ''}`;
    const severity = detectSeverity(text);
    issues.push({
      source: 'Reddit',
      type: 'reddit',
      severity,
      title: r.title,
      snippet: r.description || '',
      url: r.url,
      date: r.age || 'Recent'
    });
  });

  // Process negative news
  negativeNewsResults.slice(0, 5).forEach(r => {
    const text = `${r.title} ${r.description || ''}`;
    const severity = detectSeverity(text);
    if (severity !== 'minor') {
      issues.push({
        source: new URL(r.url).hostname.replace('www.', ''),
        type: 'news',
        severity,
        title: r.title,
        snippet: r.description || '',
        url: r.url,
        date: r.age || 'Recent'
      });
    }
  });

  // Process regulatory issues
  regulatoryResults.slice(0, 5).forEach(r => {
    const text = `${r.title} ${r.description || ''}`;
    const severity = detectSeverity(text);
    issues.push({
      source: new URL(r.url).hostname.replace('www.', ''),
      type: 'regulatory',
      severity,
      title: r.title,
      snippet: r.description || '',
      url: r.url,
      date: r.age || 'Recent'
    });
  });

  // Calculate scores based on issues found
  const calculateScore = (issueList: ReputationIssue[], baseScore: number = 85): number => {
    let score = baseScore;
    issueList.forEach(issue => {
      if (issue.severity === 'severe') score -= 15;
      else if (issue.severity === 'moderate') score -= 8;
      else score -= 3;
    });
    return Math.max(0, Math.min(100, score));
  };

  const consumerIssues = issues.filter(i => i.type === 'consumer');
  const redditIssues = issues.filter(i => i.type === 'reddit');
  const newsIssues = issues.filter(i => i.type === 'news');
  const regIssues = issues.filter(i => i.type === 'regulatory');

  const consumerSentiment = calculateScore(consumerIssues, consumerResults.length > 0 ? 80 : 75);
  const socialMediaSentiment = calculateScore(redditIssues, redditResults.length > 0 ? 80 : 75);
  const mediaSentiment = calculateScore(newsIssues, negativeNewsResults.length > 0 ? 85 : 80);
  const regulatoryCompliance = calculateScore(regIssues, regulatoryResults.length > 0 ? 90 : 85);

  const severeCount = issues.filter(i => i.severity === 'severe').length;
  const moderateCount = issues.filter(i => i.severity === 'moderate').length;
  
  // Overall is weighted average
  const overall = Math.round(
    consumerSentiment * 0.25 +
    socialMediaSentiment * 0.20 +
    mediaSentiment * 0.30 +
    regulatoryCompliance * 0.25
  );

  // Generate summary
  let summary = '';
  if (severeCount > 0) {
    summary = `⚠️ CAUTION: Found ${severeCount} severe issue(s) requiring immediate attention. `;
  }
  if (moderateCount > 0) {
    summary += `${moderateCount} moderate concern(s) identified. `;
  }
  if (severeCount === 0 && moderateCount === 0) {
    summary = 'No major reputation concerns found in the past 24 months. ';
  }
  summary += `Overall reputation score: ${overall}/100.`;

  return {
    overall,
    consumerSentiment,
    socialMediaSentiment,
    mediaSentiment,
    regulatoryCompliance,
    issues: issues.slice(0, 10), // Keep top 10 issues
    summary
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
    // Helper function to call AI (for passing to ESG/reputation modules)
    const callAI = async (prompt: string): Promise<string | null> => {
      const groqKey = process.env.GROQ_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      
      // Try Groq first
      if (groqKey) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            return data.choices[0]?.message?.content || null;
          }
        } catch (e) { console.error('Groq error:', e); }
      }
      
      // Fallback to OpenAI
      if (openaiKey) {
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
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            return data.choices[0]?.message?.content || null;
          }
        } catch (e) { console.error('OpenAI error:', e); }
      }
      
      return null;
    };

    // Search for company info + reputation data
    // Use Google News RSS for news (FREE, no API key!)
    const [
      companyResults, 
      newsResults, 
      riskResults,
      consumerResults,
      redditResults,
      negativeNewsResults,
      regulatoryResults,
      employeeResults
    ] = await Promise.all([
      searchBrave(`${supplier} company profile overview`),
      searchGoogleNews(`${supplier}`), // Google News RSS - FREE!
      searchBrave(`${supplier} supply chain risk issues`),
      // Reputation searches
      searchBrave(`"${supplier}" reviews complaints consumer feedback`),
      searchBrave(`site:reddit.com "${supplier}" problems issues experience`),
      searchBrave(`"${supplier}" scandal controversy lawsuit problem -site:reddit.com`),
      searchBrave(`"${supplier}" FDA warning EPA violation regulatory fine citation recall`),
      searchEmployeeReviews(supplier), // Glassdoor/employee reviews
    ]);

    // Combine all search results for AI analysis
    const allResults = [...companyResults, ...newsResults, ...riskResults];

    // Get AI analysis, ESG score, and reputation in parallel
    const [aiAnalysis, esgScore, aiReputation] = await Promise.all([
      analyzeWithAI(supplier, allResults),
      getESGScore(supplier, allResults, callAI), // NEW: Real ESG data search
      analyzeReputationWithAI(supplier, {
        consumer: consumerResults,
        social: redditResults,
        news: negativeNewsResults,
        regulatory: regulatoryResults,
        glassdoor: employeeResults,
      }, callAI), // NEW: AI-powered reputation analysis
    ]);

    // Extract news items
    const news = extractNews(newsResults);

    // Convert AI reputation to legacy format for compatibility
    const reputation: ReputationScore = {
      overall: aiReputation.overall,
      consumerSentiment: aiReputation.breakdown.consumerSentiment,
      socialMediaSentiment: aiReputation.breakdown.employeeSentiment,
      mediaSentiment: aiReputation.breakdown.mediaSentiment,
      regulatoryCompliance: aiReputation.breakdown.regulatoryCompliance,
      issues: aiReputation.issues.map(i => ({
        source: i.source,
        type: i.type as any,
        severity: i.severity,
        title: i.title,
        snippet: i.snippet + (i.aiAnalysis ? ` [AI Analysis: ${i.aiAnalysis}]` : ''),
        url: i.url,
        date: i.date,
      })),
      summary: aiReputation.summary + ` (${aiReputation.methodology})`,
    };

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
      // Use NEW ESG score with source info
      esgScore: {
        environmental: esgScore.environmental,
        social: esgScore.social,
        governance: esgScore.governance,
        overall: esgScore.overall,
        source: esgScore.source,
        confidence: esgScore.confidence,
        riskLevel: esgScore.riskLevel,
      },
      competitivePosition: aiAnalysis.competitivePosition || '',
      supplyChainRole: aiAnalysis.supplyChainRole || '',
      certifications: aiAnalysis.certifications || [],
      recentDevelopments: aiAnalysis.recentDevelopments || [],
      aiAnalysis: aiAnalysis.aiAnalysis || '',
      reputation: reputation,
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
