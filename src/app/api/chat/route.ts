import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Web search — free sources first, paid APIs as bonus if configured
async function searchWeb(query: string): Promise<string> {
  const allResults: string[] = [];

  // 1. Google News RSS (FREE, no key required) — best for current events
  try {
    const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const newsResponse = await fetch(newsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SupplierIntelBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    
    if (newsResponse.ok) {
      const xml = await newsResponse.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const sourceRegex = /<source[^>]*>(.*?)<\/source>/;
      
      let match;
      let newsCount = 0;
      while ((match = itemRegex.exec(xml)) !== null && newsCount < 5) {
        const item = match[1];
        const titleMatch = item.match(titleRegex);
        const linkMatch = item.match(linkRegex);
        const dateMatch = item.match(pubDateRegex);
        const sourceMatch = item.match(sourceRegex);
        
        if (titleMatch && linkMatch) {
          const title = (titleMatch[1] || titleMatch[2] || '').trim();
          const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';
          let dateStr = '';
          if (dateMatch) {
            const d = new Date(dateMatch[1]);
            const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
            dateStr = diffH < 24 ? `${diffH}h ago` : diffH < 48 ? 'yesterday' : `${Math.floor(diffH / 24)}d ago`;
          }
          allResults.push(`- [NEWS${dateStr ? ' ' + dateStr : ''}] ${title} (Source: ${source})`);
          newsCount++;
        }
      }
      if (newsCount > 0) {
        console.log(`Google News returned ${newsCount} results for: ${query}`);
      }
    }
  } catch (error) {
    console.error('Google News RSS error:', error);
  }

  // 2. DuckDuckGo Instant Answer (FREE, no key) — good for factual/reference info
  try {
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (ddgResponse.ok) {
      const data = await ddgResponse.json();
      
      if (data.Abstract) {
        allResults.push(`- [REF] ${data.Heading}: ${data.Abstract} (Source: ${data.AbstractURL})`);
      }
      
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            allResults.push(`- [REF] ${topic.Text} (Source: ${topic.FirstURL})`);
          }
        });
      }
    }
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
  }

  // 3. Serper.dev (paid, if configured)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey && allResults.length < 3) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 5 }),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        (data.organic || []).slice(0, 5).forEach((r: any) => {
          allResults.push(`- ${r.title}: ${r.snippet || ''} (Source: ${r.link})`);
        });
      }
    } catch (error) {
      console.error('Serper search error:', error);
    }
  }

  // 4. Brave API (paid, if configured)
  const braveKey = process.env.BRAVE_API_KEY;
  if (braveKey && allResults.length < 3) {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        {
          headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        (data.web?.results || []).slice(0, 5).forEach((r: any) => {
          allResults.push(`- ${r.title}: ${r.description || ''} (Source: ${r.url})`);
        });
      }
    } catch (error) {
      console.error('Brave search error:', error);
    }
  }

  console.log(`Total search results: ${allResults.length}`);
  return allResults.join('\n');
}

// Detect if question needs web search
// Broadly permissive — if we have a supplier context, almost any question benefits from search
function needsWebSearch(message: string): boolean {
  // Skip search only for trivial/meta messages
  const skipPatterns = [
    /^(hi|hello|hey|thanks|thank you|ok|bye|yes|no)\.?$/i,
    /^what can you do/i,
    /^help$/i,
  ];
  if (skipPatterns.some(p => p.test(message.trim()))) {
    return false;
  }
  // Everything else gets search — users chatting about a supplier want current info
  return message.trim().length > 5;
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
      
      // Build a focused search query — don't dump the entire user message
      const queryKeywords = message
        .replace(/[?!.,;:'"]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 6)
        .join(' ');
      const searchQuery = `${supplierName} ${queryKeywords}`;
      console.log('Search query:', searchQuery);
      
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
