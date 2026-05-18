/**
 * Creem Moderation API client.
 *
 * 在所有支持文本提示的 AI 生成接口（520 文案、情侣写真、情侣大头贴、情感分析、
 * 恋爱回忆录、情侣音乐等）调用此模块，把用户提示词在到达模型之前先送到 Creem
 * 内容审核接口。审核通过才允许继续；deny / flag 都按拒绝处理（按 Creem 官方
 * 建议）；接口异常按"fail closed"处理——也拒绝，避免把不安全提示混过去。
 *
 * 文档：https://docs.creem.io/features/moderation
 */
export type ModerationDecision = 'allow' | 'flag' | 'deny';

export interface ModerationResult {
  decision: ModerationDecision;
  /** Whether the prompt should be allowed through. */
  allowed: boolean;
  /** Reason code suitable for surfacing to UI. */
  reason?: 'rejected' | 'flagged' | 'unavailable' | 'disabled';
  /** Raw response id from Creem (for auditing). */
  id?: string;
  /** Echoed external_id we passed in. */
  externalId?: string;
}

/** Build the Creem API base URL based on environment. */
function getModerationBaseUrl(): string {
  return (
    process.env.CREEM_MODERATION_URL ||
    process.env.CREEM_API_URL ||
    'https://api.creem.io'
  );
}

/** How many seconds to wait before failing closed. */
const TIMEOUT_MS = Number(process.env.CREEM_MODERATION_TIMEOUT_MS || 5000);

/**
 * Screen a free-text user prompt against Creem's content policies.
 *
 * Required for all AI image / video / text generation endpoints on Creem-merchant
 * accounts. Returns `{ allowed: false }` for `deny`, `flag`, network errors, or
 * missing API key (fail-closed).
 */
export async function moderatePrompt(
  prompt: string,
  externalId?: string
): Promise<ModerationResult> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    // No key configured — fail closed in production, but allow locally with a warning
    // so dev environments don't break. Production should always have the key set.
    if (process.env.NODE_ENV === 'production') {
      console.error('[moderation] CREEM_API_KEY missing in production — failing closed');
      return { decision: 'deny', allowed: false, reason: 'unavailable' };
    }
    console.warn('[moderation] CREEM_API_KEY missing — bypass enabled in non-production');
    return { decision: 'allow', allowed: true, reason: 'disabled' };
  }

  // Skip empty / whitespace-only prompts.
  const trimmed = prompt?.trim();
  if (!trimmed) {
    return { decision: 'allow', allowed: true };
  }

  const url = `${getModerationBaseUrl().replace(/\/$/, '')}/v1/moderation/prompt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ prompt: trimmed, external_id: externalId }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[moderation] HTTP ${res.status} — failing closed`);
      return { decision: 'deny', allowed: false, reason: 'unavailable' };
    }

    const data = (await res.json()) as {
      id?: string;
      decision?: ModerationDecision;
      external_id?: string;
    };

    const decision: ModerationDecision = data?.decision ?? 'deny';

    // Per Creem docs: treat both `deny` and `flag` as block.
    if (decision === 'allow') {
      return { decision, allowed: true, id: data.id, externalId: data.external_id };
    }
    return {
      decision,
      allowed: false,
      reason: decision === 'flag' ? 'flagged' : 'rejected',
      id: data.id,
      externalId: data.external_id,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error(`[moderation] timeout after ${TIMEOUT_MS}ms — failing closed`);
    } else {
      console.error('[moderation] request failed — failing closed:', err?.message || err);
    }
    return { decision: 'deny', allowed: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

/** Combine multiple prompt fragments into a single screening string. */
export function joinPrompts(...parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean)
    .join('\n');
}
