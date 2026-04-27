export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, system, model = 'claude-haiku-4-5-20251001' } = body;
  const apiKey = context.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 2048, system, messages }),
    });

    const text = await res.text();
    return new Response(text || JSON.stringify({ error: 'Empty response from Anthropic' }), {
      status: text ? res.status : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to reach Anthropic API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
