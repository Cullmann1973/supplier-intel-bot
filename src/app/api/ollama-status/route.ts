import { NextResponse } from 'next/server';

export async function GET() {
  // Try local Ollama endpoints
  const ollamaUrls = [
    'http://127.0.0.1:11434',  // Local Mac
    'http://localhost:11434',  // Local Mac alternate
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
    message: 'Ollama not available. Start it with: ollama serve',
  });
}
