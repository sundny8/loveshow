/**
 * Creem Content Moderation API integration.
 *
 * Required by Creem for all AI image/video/audio generation platforms.
 * Every user-supplied prompt routed to a generation model must be screened
 * BEFORE the model runs. See:
 *   https://docs.creem.io/features/moderation
 *   https://docs.creem.io/api-reference/endpoint/screen-prompt
 *
 * Behavior contract (per Creem guidelines):
 *   - Call before any billing or model invocation
 *   - Treat both `deny` and `flag` as block
 *   - Fail closed on network / 5xx / timeout (do NOT generate)
 *   - 5s timeout
 *   - external_id pattern: `user_<userId>:<kind>` for auditing
 */

import { NextResponse } from 'next/server';

const CREEM_API_BASE = process.env.CREEM_API_BASE || 'https://api.creem.io';
const CREEM_API_KEY = process.env.CREEM_API_KEY;

// Allow dev-time bypass so local development without a Creem key still works.
// In production a missing key MUST fail closed (treat as moderation outage).
const ALLOW_DEV_BYPASS = process.env.NODE_ENV !== 'production';

export type ModerationDecision = 'allow' | 'deny' | 'flag';

export interface ModerationResult {
  /** true means it's safe for the caller to proceed with generation. */
  ok: boolean;
  /** Raw decision from Creem; null when the call did not complete. */
  decision: ModerationDecision | null;
  /** Failure mode for the caller to map to an HTTP response. */
  errorCode?: 'prompt_rejected' | 'moderation_unavailable';
  /** Echoed external_id, useful for support correlation. */
  externalId?: string;
  /** Creem moderation result id, useful for support correlation. */
  moderationId?: string;
}

export interface ModeratePromptInput {
  /** The full user-supplied text to screen. Empty/whitespace is treated as ok. */
  prompt: string;
  /** Identifier for auditing, e.g. `user_${userId}:copy`. */
  externalId?: string;
}

/**
 * Screen a user prompt against Creem's content policies.
 *
 * @returns A ModerationResult — caller must check `ok` and route accordingly.
 *          On `ok=false`, use `moderationErrorResponse()` to build the reply.
 */
export async function moderatePrompt({
  prompt,
  externalId,
}: ModeratePromptInput): Promise<ModerationResult> {
  const trimmed = (prompt ?? '').trim();
  if (!trimmed) {
    // No user-supplied free text to screen → trivially safe.
    return { ok: true, decision: null, externalId };
  }

  if (!CREEM_API_KEY) {
    if (ALLOW_DEV_BYPASS) {
      console.warn(
        '[moderation] CREEM_API_KEY missing — bypassing in non-production. ' +
          'Set CREEM_API_KEY in your environment before deploying.'
      );
      return { ok: true, decision: null, externalId };
    }
    console.error('[moderation] CREEM_API_KEY missing in production — failing closed');
    return {
      ok: false,
      decision: null,
      errorCode: 'moderation_unavailable',
      externalId,
    };
  }

  try {
    const res = await fetch(`${CREEM_API_BASE}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt: trimmed,
        external_id: externalId,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      console.error('[moderation] non-2xx from Creem:', res.status);
      return {
        ok: false,
        decision: null,
        errorCode: 'moderation_unavailable',
        externalId,
      };
    }

    const data = (await res.json()) as {
      id?: string;
      decision?: ModerationDecision;
    };
    const decision = data?.decision;
    const moderationId = data?.id;

    if (decision === 'allow') {
      return { ok: true, decision: 'allow', externalId, moderationId };
    }
    if (decision === 'deny' || decision === 'flag') {
      console.warn('[moderation] blocked', { decision, externalId, moderationId });
      return {
        ok: false,
        decision,
        errorCode: 'prompt_rejected',
        externalId,
        moderationId,
      };
    }

    // Unknown / missing decision → fail closed. Per Creem docs we should
    // ignore unknown FIELDS (forward-compat) but unknown DECISION VALUES
    // should be treated as not-allowed.
    console.warn('[moderation] unknown decision value', { decision, externalId });
    return {
      ok: false,
      decision: null,
      errorCode: 'moderation_unavailable',
      externalId,
      moderationId,
    };
  } catch (err: any) {
    // Timeout, abort, network — fail closed.
    console.error('[moderation] call failed:', err?.message || err);
    return {
      ok: false,
      decision: null,
      errorCode: 'moderation_unavailable',
      externalId,
    };
  }
}

/**
 * Concatenate multiple user-supplied fields into a single screening payload.
 * Empty / null / undefined parts are dropped.
 */
export function combineUserText(
  parts: Array<string | null | undefined>
): string {
  return parts
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Build a NextResponse for a non-ok moderation result.
 * Caller does:
 *   if (!result.ok) return moderationErrorResponse(result);
 */
export function moderationErrorResponse(result: ModerationResult): NextResponse {
  if (result.errorCode === 'prompt_rejected') {
    return NextResponse.json(
      {
        error: 'prompt_rejected',
        message:
          '您的输入未通过内容安全审核，请修改后重试。Your input was rejected by our content safety screening. Please revise and try again.',
        moderationId: result.moderationId,
      },
      { status: 400 }
    );
  }
  // moderation_unavailable (network / 5xx / timeout / missing key in prod)
  return NextResponse.json(
    {
      error: 'moderation_unavailable',
      message:
        '内容安全服务暂时不可用，请稍后重试。Content safety service is temporarily unavailable. Please try again in a moment.',
    },
    { status: 503 }
  );
}
