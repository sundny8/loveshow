import OpenAI from 'openai';

/**
 * Chat-completion wrapper supporting:
 *  - OPENAI_URL proxy (fetch)
 *  - Official SDK (no OPENAI_URL)
 * Default model: OPENAI_TEXT_MODEL || 'gpt-4o-mini'
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompleteParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function completeText(params: CompleteParams): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('openai_disabled');

  const baseURL = process.env.OPENAI_URL;
  const timeoutMs = Number(process.env.OPENAI_TEXT_TIMEOUT_MS || 60_000);
  const model = params.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

  if (baseURL) {
    return await callViaProxy(baseURL, apiKey, model, params, timeoutMs);
  }
  return await callViaSDK(apiKey, model, params, timeoutMs);
}

async function callViaProxy(
  baseURL: string,
  apiKey: string,
  model: string,
  params: CompleteParams,
  timeoutMs: number
): Promise<string> {
  const url = `${baseURL.replace(/\/$/, '')}/v1/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.8,
        max_tokens: params.maxTokens ?? 1500,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`openai_text_error ${res.status}: ${text}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = json.choices?.[0]?.message?.content?.trim();
    if (!out) throw new Error('openai_text_empty');
    return out;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error(`openai_text_timeout after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callViaSDK(
  apiKey: string,
  model: string,
  params: CompleteParams,
  timeoutMs: number
): Promise<string> {
  const client = new OpenAI({ apiKey, timeout: timeoutMs, maxRetries: 1 });
  const res = await client.chat.completions.create({
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.8,
    max_tokens: params.maxTokens ?? 1500,
  });
  const out = res.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('openai_text_empty');
  return out;
}
