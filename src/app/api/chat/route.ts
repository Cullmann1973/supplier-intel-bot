import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Web search using Serper.dev (free tier) or Brave API
async function searchWeb(query: string): Promise<string> {
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
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        if (results.length > 0) {
          return results
            .slice(0, 5)
            .map((r: any) => `- ${r.title}: ${r.snippet || ''} (Source: ${r.link})`)
            .join('\n');
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
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
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
          return results
            .slice(0, 5)
            .map((r: any) => `- ${r.title}: ${r.description || ''} (Source: ${r.url})`)
            .join('\n');
        }
      }
    } catch (error) {
      console.error('Brave search error:', error);
    }
  }

  // Try Google News RSS (free, no key required)
  try {
    const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const newsResponse = await fetch(newsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SupplierIntelBot/1.0)' },
    });
    
    if (newsResponse.ok) {
      const xml = await newsResponse.text();
      const results: string[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const sourceRegex = /<source[^>]*>(.*?)<\/source>/;
      
      let match;
      while ((match = itemRegex.exec(xml)) !== null && results.length < 5) {
        const item = match[1];
        const titleMatch = item.match(titleRegex);
        const linkMatch = item.match(linkRegex);
        const sourceMatch = item.match(sourceRegex);
        
        if (titleMatch && linkMatch) {
          const title = (titleMatch[1] || titleMatch[2] || '').trim();
          const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';
          results.push(`- ${title} (Source: ${source})`);
        }
      }
      
      if (results.length > 0) {
        console.log(`Google News returned ${results.length} results for: ${query}`);
        return results.join('\n');
      }
    }
  } catch (error) {
    console.error('Google News RSS error:', error);
  }

  // Fallback: DuckDuckGo Instant Answer (free, no key)
  try {
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    
    if (ddgResponse.ok) {
      const data = await ddgResponse.json();
      const results: string[] = [];
      
      if (data.Abstract) {
        results.push(`- ${data.Heading}: ${data.Abstract} (Source: ${data.AbstractURL})`);
      }
      
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push(`- ${topic.Text} (Source: ${topic.FirstURL})`);
          }
        });
      }
      
      if (results.length > 0) {
        return results.join('\n');
      }
    }
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
  }

  return '';
}

// Detect if question needs web search
function needsWebSearch(message: string): boolean {
  const searchTriggers = [
    'fda', 'epa', 'osha', 'warning', 'recall', 'inspection', 'lawsuit', 'lawsuit',
    'recent', 'latest', 'news', 'current', 'today', '2024', '2025', '2026',
    'plant', 'factory', 'location', 'facility', 'manufacture',
    'competitor', 'acquisition', 'merger', 'bankruptcy', 'financial',
    'certification', 'iso', 'audit', 'violation', 'fine', 'penalty'
  ];
  const lower = message.toLowerCase();
  return searchTriggers.some(trigger => lower.includes(trigger));
}

// Try multiple AI providers with fallback
async function callAI(messages: { role: string; content: string }[]): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  // Try Groq first (free tier available)
  if (groqKey) {
    try {
      console.log('Trying Groq...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0]?.message?.content;
        if (reply) {
          console.log('Groq response successful');
          return reply;
        }
      }
    } catch (error) {
      console.error('Groq error:', error);
    }
  }

  // Try OpenAI as fallback
  if (openaiKey) {
    try {
      console.log('Trying OpenAI...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0]?.message?.content;
        if (reply) {
          console.log('OpenAI response successful');
          return reply;
        }
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  // Try local Ollama as final fallback (free)
  const ollamaUrls = ['http://127.0.0.1:11434', 'http://localhost:11434'];
  for (const baseUrl of ollamaUrls) {
    try {
      console.log(`Trying Ollama at ${baseUrl}...`);
      
      // Check available models
      const tagsRes = await fetch(`${baseUrl}/api/tags`, { 
        signal: AbortSignal.timeout(3000) 
      });
      if (!tagsRes.ok) continue;
      
      const tagsData = await tagsRes.json();
      const models = tagsData.models?.map((m: any) => m.name) || [];
      const model = models.find((m: string) => m.includes('qwen') || m.includes('llama')) || models[0];
      if (!model) continue;

      // Convert messages to single prompt for Ollama
      const prompt = messages.map(m => 
        m.role === 'system' ? `System: ${m.content}` : 
        m.role === 'user' ? `User: ${m.content}` : 
        `Assistant: ${m.content}`
      ).join('\n\n') + '\n\nAssistant:';

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: { temperature: 0.7, num_predict: 1000 }
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          console.log('Ollama response successful');
          return data.response;
        }
      }
    } catch (error) {
      console.log(`Ollama at ${baseUrl} not available`);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { message, supplierContext, history, supplierName } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Perform web search if needed
    let webSearchResults = '';
    if (needsWebSearch(message) && supplierName) {
      console.log('Performing web search for:', message);
      const searchQuery = `${supplierName} ${message}`;
      webSearchResults = await searchWeb(searchQuery);
      if (webSearchResults) {
        console.log('Web search returned results');
      }
    }

    // Build the system prompt with supplier context and web results
    const systemPrompt = `You are a supply chain intelligence assistant helping analyze suppliers. 
You have access to the following supplier information:

${supplierContext || 'No specific supplier context provided.'}

${webSearchResults ? `
RECENT WEB SEARCH RESULTS for "${message}":
${webSearchResults}

Use these search results to provide current, accurate information. Always cite the source when using information from search results.
` : ''}

Answer questions about this supplier based on:
1. The web search results above (if available) - prioritize this for current information
2. The provided supplier context
3. Your general knowledge about the company and industry

Be concise, factual, and helpful. When citing web search results, mention the source.
If you don't have specific information and no search results are available, say so clearly.`;

    // Build messages array
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages to keep context manageable)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: ChatMessage) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call AI with fallbacks
    const reply = await callAI(messages);
    
    if (!reply) {
      return NextResponse.json({ 
        error: 'No AI service available. Configure GROQ_API_KEY, OPENAI_API_KEY, or run Ollama locally.' 
      }, { status: 500 });
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
