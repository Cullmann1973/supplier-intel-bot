import { NextResponse } from 'next/server';

export async function GET() {
  // Check for cloud AI providers first
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  // If any cloud provider is configured, report as online
  if (hasOpenAI || hasGroq || hasAnthropic) {
    const providers = [];
    if (hasGroq) providers.push('Groq');
    if (hasOpenAI) providers.push('OpenAI');
    if (hasAnthropic) providers.push('Anthropic');
    
    return NextResponse.json({
      status: 'online',
      provider: providers[0],
      providers,
      message: `AI powered by ${providers.join(', ')}`,
    });
  }

  // Try local Ollama as fallback
  const ollamaUrls = [
    'http://127.0.0.1:11434',
    'http://localhost:11434',
  ];

  for (const baseUrl of ollamaUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        return NextResponse.json({
          status: 'online',
          provider: 'Ollama',
          url: baseUrl,
          models,
        });
      }
    } catch {
      // Try next URL
    }
  }

  return NextResponse.json({
    status: 'offline',
    message: 'No AI service configured. Add OPENAI_API_KEY or GROQ_API_KEY.',
  });
}
