import { NextRequest, NextResponse } from 'next/server';

interface Supplier {
  id: string;
  name: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  score: number;
  trend: 'up' | 'down' | 'flat';
}

async function analyzeWithOllama(suppliers: Supplier[]): Promise<string | null> {
  const ollamaUrls = [
    'http://127.0.0.1:11434',
    'http://localhost:11434',
  ];

  const prompt = `You are a supply chain risk analyst. Analyze this supplier portfolio and provide strategic insights.

SUPPLIER DATA:
${JSON.stringify(suppliers, null, 2)}

Provide a concise analysis covering:
1. **Critical Risks**: Which suppliers need immediate attention and why
2. **Portfolio Vulnerabilities**: Concentration risks, geographic exposure
3. **Recommendations**: Specific actions to improve supply chain resilience
4. **Opportunities**: Suppliers showing positive trends to leverage

Be specific and actionable. Keep it under 400 words.`;

  for (const baseUrl of ollamaUrls) {
    try {
      console.log(`Trying Ollama at ${baseUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for analysis

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:30b-a3b', // Use the local Mac model
          prompt: prompt,
          stream: false,
          options: { 
            temperature: 0.7,
            num_predict: 800,
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Ollama analysis complete');
        return data.response || null;
      }
    } catch (error) {
      console.log(`Ollama at ${baseUrl} failed:`, error);
    }
  }

  return null;
}

function generateFallbackAnalysis(suppliers: Supplier[]): string {
  const highRisk = suppliers.filter(s => s.risk === 'high');
  const declining = suppliers.filter(s => s.trend === 'down');
  const improving = suppliers.filter(s => s.trend === 'up');

  let analysis = '## Portfolio Analysis\n\n';

  if (highRisk.length > 0) {
    analysis += `**🚨 Critical Risks:**\n`;
    highRisk.forEach(s => {
      analysis += `- ${s.name} (Score: ${s.score}/100) - Requires immediate attention\n`;
    });
    analysis += '\n';
  }

  if (declining.length > 0) {
    analysis += `**📉 Declining Suppliers:**\n`;
    declining.forEach(s => {
      analysis += `- ${s.name} (${s.category}) - Monitor closely\n`;
    });
    analysis += '\n';
  }

  if (improving.length > 0) {
    analysis += `**📈 Positive Trends:**\n`;
    improving.forEach(s => {
      analysis += `- ${s.name} (Score: ${s.score}/100) - Consider expanding relationship\n`;
    });
    analysis += '\n';
  }

  analysis += `**Recommendations:**\n`;
  analysis += `- Develop contingency plans for ${highRisk.length} high-risk suppliers\n`;
  analysis += `- Review contracts with declining suppliers\n`;
  analysis += `- Leverage strong performers for additional capacity\n`;

  return analysis;
}

export async function POST(request: NextRequest) {
  try {
    const { suppliers } = await request.json();

    if (!suppliers || !Array.isArray(suppliers)) {
      return NextResponse.json({ error: 'Suppliers array required' }, { status: 400 });
    }

    // Try Ollama first
    const ollamaAnalysis = await analyzeWithOllama(suppliers);
    
    if (ollamaAnalysis) {
      // Clean up thinking tags if present (for models that use them)
      let cleanedAnalysis = ollamaAnalysis;
      cleanedAnalysis = cleanedAnalysis.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      return NextResponse.json({ 
        analysis: cleanedAnalysis,
        source: 'ollama',
      });
    }

    // Fallback to simple analysis
    const fallback = generateFallbackAnalysis(suppliers);
    return NextResponse.json({
      analysis: fallback,
      source: 'fallback',
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio' },
      { status: 500 }
    );
  }
}
