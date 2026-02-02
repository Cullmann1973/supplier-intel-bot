// ESG and Reputation scoring improvements
// Uses real data sources + AI analysis

interface ESGScore {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
  source: 'sustainalytics' | 'msci' | 'sp-global' | 'cdp' | 'ai-estimated';
  confidence: 'high' | 'medium' | 'low';
  riskLevel?: string; // e.g., "Low Risk", "Medium Risk"
  lastUpdated?: string;
}

interface ReputationAnalysis {
  overall: number;
  breakdown: {
    consumerSentiment: number;
    employeeSentiment: number;
    mediaSentiment: number;
    regulatoryCompliance: number;
  };
  issues: Array<{
    source: string;
    type: string;
    severity: 'minor' | 'moderate' | 'severe';
    title: string;
    snippet: string;
    url: string;
    date: string;
    aiAnalysis: string;
  }>;
  summary: string;
  methodology: string;
}

// Search Google News RSS for ESG data
async function searchForESGData(companyName: string): Promise<any[]> {
  const queries = [
    `${companyName} ESG score rating sustainalytics`,
    `${companyName} ESG rating MSCI`,
    `${companyName} sustainability score CDP`,
    `${companyName} ESG risk rating`,
  ];
  
  const results: any[] = [];
  
  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SupplierIntelBot/1.0)' },
      });
      
      if (response.ok) {
        const xml = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
        const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
        
        let match;
        while ((match = itemRegex.exec(xml)) !== null && results.length < 15) {
          const item = match[1];
          const titleMatch = item.match(titleRegex);
          const descMatch = item.match(descRegex);
          
          if (titleMatch) {
            results.push({
              title: (titleMatch[1] || titleMatch[2] || '').trim(),
              description: (descMatch?.[1] || descMatch?.[2] || '').trim(),
              query,
            });
          }
        }
      }
    } catch (error) {
      console.error(`ESG search error for query: ${query}`, error);
    }
  }
  
  return results;
}

// Use AI to extract real ESG scores from search results
export async function getESGScore(
  companyName: string,
  searchResults: any[],
  callAI: (prompt: string) => Promise<string | null>
): Promise<ESGScore> {
  // First, search specifically for ESG data
  const esgSearchResults = await searchForESGData(companyName);
  const allResults = [...esgSearchResults, ...searchResults];
  
  const searchContext = allResults
    .slice(0, 20)
    .map(r => `- ${r.title}: ${r.description || ''}`)
    .join('\n');

  const prompt = `You are an ESG data analyst. Analyze the following search results about "${companyName}" and extract any REAL ESG scores or ratings mentioned.

Search results:
${searchContext || 'No search results available.'}

Your task:
1. Look for ACTUAL ESG scores from recognized providers (Sustainalytics, MSCI, S&P Global, CDP, Refinitiv)
2. Extract specific numbers if mentioned (e.g., "ESG Risk Score of 18.5" or "AA rating" or "B- score")
3. Note the risk level if mentioned (Negligible, Low, Medium, High, Severe)
4. If NO real scores are found, estimate based on available information about the company

Respond in this exact JSON format:
{
  "foundRealScore": true/false,
  "source": "sustainalytics" | "msci" | "sp-global" | "cdp" | "ai-estimated",
  "environmental": <0-100 score>,
  "social": <0-100 score>,
  "governance": <0-100 score>,
  "overall": <0-100 score>,
  "riskLevel": "Negligible" | "Low" | "Medium" | "High" | "Severe" | null,
  "confidence": "high" | "medium" | "low",
  "reasoning": "Brief explanation of where score came from"
}

IMPORTANT: 
- For Sustainalytics, LOWER scores are BETTER (0-10 = Negligible, 10-20 = Low, 20-30 = Medium, 30-40 = High, 40+ = Severe)
- For MSCI, letter grades: AAA/AA = Leader (90+), A/BBB/BB = Average (50-80), B/CCC = Laggard (20-50)
- Convert all scores to 0-100 scale where HIGHER = BETTER
- If estimating, use conservative mid-range values and set confidence to "low"`;

  try {
    const response = await callAI(prompt);
    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          environmental: data.environmental || 70,
          social: data.social || 70,
          governance: data.governance || 70,
          overall: data.overall || 70,
          source: data.foundRealScore ? data.source : 'ai-estimated',
          confidence: data.confidence || 'low',
          riskLevel: data.riskLevel,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
    }
  } catch (error) {
    console.error('ESG AI analysis error:', error);
  }

  // Fallback
  return {
    environmental: 70,
    social: 70,
    governance: 70,
    overall: 70,
    source: 'ai-estimated',
    confidence: 'low',
  };
}

// AI-powered reputation analysis
export async function analyzeReputationWithAI(
  companyName: string,
  searchResults: {
    consumer: any[];
    social: any[];
    news: any[];
    regulatory: any[];
    glassdoor: any[];
  },
  callAI: (prompt: string) => Promise<string | null>
): Promise<ReputationAnalysis> {
  
  // Combine all results with source tagging
  const allResults = [
    ...searchResults.consumer.slice(0, 5).map(r => ({ ...r, sourceType: 'consumer' })),
    ...searchResults.social.slice(0, 5).map(r => ({ ...r, sourceType: 'social' })),
    ...searchResults.news.slice(0, 8).map(r => ({ ...r, sourceType: 'news' })),
    ...searchResults.regulatory.slice(0, 5).map(r => ({ ...r, sourceType: 'regulatory' })),
  ];

  const searchContext = allResults
    .map(r => `[${r.sourceType.toUpperCase()}] ${r.title}: ${r.description || ''} (Source: ${r.url || 'unknown'})`)
    .join('\n\n');

  const prompt = `You are a corporate reputation analyst. Analyze the following search results about "${companyName}" and provide a comprehensive reputation assessment.

Search Results:
${searchContext || 'No search results available.'}

Analyze each result and provide:
1. Overall sentiment (positive, negative, neutral)
2. Severity of any issues found
3. Credibility of the source (major news = high, blogs = low, regulatory = very high)
4. Recency weight (recent issues matter more)

Respond in this exact JSON format:
{
  "overall": <0-100, where 100 is excellent reputation>,
  "breakdown": {
    "consumerSentiment": <0-100>,
    "employeeSentiment": <0-100>,
    "mediaSentiment": <0-100>,
    "regulatoryCompliance": <0-100>
  },
  "issues": [
    {
      "title": "Issue title",
      "severity": "minor" | "moderate" | "severe",
      "type": "consumer" | "employee" | "regulatory" | "legal" | "environmental" | "social",
      "source": "Source name",
      "snippet": "Brief description",
      "aiAnalysis": "Your analysis of why this matters"
    }
  ],
  "summary": "2-3 sentence executive summary of reputation status",
  "positiveFactors": ["list of positive reputation factors found"],
  "riskFactors": ["list of reputation risks identified"]
}

Scoring guidelines:
- 90-100: Excellent - No significant issues, positive coverage
- 70-89: Good - Minor issues only, generally positive
- 50-69: Fair - Some concerns, mixed coverage
- 30-49: Poor - Significant issues, negative coverage
- 0-29: Critical - Major scandals, regulatory action, lawsuits

Be objective and base scores on actual evidence in the search results.
If limited information is available, use moderate scores (60-75) and note low confidence.`;

  try {
    const response = await callAI(prompt);
    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          overall: data.overall || 75,
          breakdown: {
            consumerSentiment: data.breakdown?.consumerSentiment || 75,
            employeeSentiment: data.breakdown?.employeeSentiment || 75,
            mediaSentiment: data.breakdown?.mediaSentiment || 75,
            regulatoryCompliance: data.breakdown?.regulatoryCompliance || 80,
          },
          issues: (data.issues || []).map((issue: any) => ({
            source: issue.source || 'Unknown',
            type: issue.type || 'general',
            severity: issue.severity || 'minor',
            title: issue.title || 'Unnamed issue',
            snippet: issue.snippet || '',
            url: '',
            date: 'Recent',
            aiAnalysis: issue.aiAnalysis || '',
          })),
          summary: data.summary || 'Reputation analysis based on available public information.',
          methodology: 'AI-analyzed sentiment from consumer reviews, social media, news coverage, and regulatory filings.',
        };
      }
    }
  } catch (error) {
    console.error('Reputation AI analysis error:', error);
  }

  // Fallback
  return {
    overall: 75,
    breakdown: {
      consumerSentiment: 75,
      employeeSentiment: 75,
      mediaSentiment: 75,
      regulatoryCompliance: 80,
    },
    issues: [],
    summary: 'Limited public information available for comprehensive reputation analysis.',
    methodology: 'Baseline score due to limited data availability.',
  };
}

// Search for Glassdoor/employee reviews
export async function searchEmployeeReviews(companyName: string): Promise<any[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${companyName} glassdoor reviews employee`)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SupplierIntelBot/1.0)' },
    });
    
    if (response.ok) {
      const xml = await response.text();
      const results: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      
      let match;
      while ((match = itemRegex.exec(xml)) !== null && results.length < 5) {
        const item = match[1];
        const titleMatch = item.match(titleRegex);
        if (titleMatch) {
          results.push({
            title: (titleMatch[1] || titleMatch[2] || '').trim(),
            description: '',
          });
        }
      }
      return results;
    }
  } catch (error) {
    console.error('Employee review search error:', error);
  }
  return [];
}
