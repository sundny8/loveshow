/**
 * Waffo Pancake Content Safety integration.
 *
 * Every prompt or textual generation intent must be scanned before billing or
 * model invocation. Only an explicit `allow` verdict may continue. `review`,
 * `block`, malformed responses, timeouts, and configuration errors fail closed.
 *
 * Docs:
 * https://docs.waffo.ai/zh/api-reference/endpoints/content-safety/scan-prompt
 */

import { createHash, sign } from 'node:crypto';
import { NextResponse } from 'next/server';

const WAFFO_API_BASE = process.env.WAFFO_API_BASE || 'https://api.waffo.ai';
const WAFFO_SCAN_PATH = '/v1/actions/verification/scan-prompt';
const WAFFO_MERCHANT_ID = process.env.WAFFO_MERCHANT_ID;
const WAFFO_PRIVATE_KEY = process.env.WAFFO_PRIVATE_KEY?.replace(/\\n/g, '\n');
const WAFFO_SEMANTIC_MODE = parseSemanticMode(
  process.env.WAFFO_CONTENT_SAFETY_SEMANTIC
);

const MAX_PROMPT_LENGTH = 10_000;
const REQUEST_TIMEOUT_MS = 5_000;
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [5_000, 10_000, 20_000] as const;

// Local development remains usable without production credentials. Production
// always fails closed when Waffo credentials are missing or invalid.
const ALLOW_DEV_BYPASS = process.env.NODE_ENV !== 'production';

export type ModerationDecision = 'allow' | 'review' | 'block';
export type ModerationErrorCode =
  | 'prompt_rejected'
  | 'prompt_too_long'
  | 'moderation_review'
  | 'moderation_unavailable';

type WaffoSemanticMode = 'off' | 'shadow' | 'enforce';
type WaffoLocale = 'ja' | 'en' | 'zh';

interface WaffoVerdict {
  action?: ModerationDecision;
  reasonCode?: string;
  matchedCategories?: string[];
  requestId?: string;
  semanticStatus?: string;
}

interface WaffoApiResponse {
  data?: WaffoVerdict | null;
  errors?: Array<{ message?: string }>;
}

export interface ModerationResult {
  /** true means Waffo explicitly returned action=allow. */
  ok: boolean;
  decision: ModerationDecision | null;
  errorCode?: ModerationErrorCode;
  externalId?: string;
  /** Waffo request id, retained under the old field name for API compatibility. */
  moderationId?: string;
  requestId?: string;
  reasonCode?: string;
  matchedCategories?: string[];
  semanticStatus?: string;
}

export interface ModeratePromptInput {
  /** User text or a textual description of an image/audio generation intent. */
  prompt: string;
  /** Local correlation id used in logs; Waffo does not receive this value. */
  externalId?: string;
  /** Optional language hint supported by Waffo. */
  locale?: WaffoLocale;
}

function parseSemanticMode(value?: string): WaffoSemanticMode {
  if (value === 'off' || value === 'shadow' || value === 'enforce') {
    return value;
  }
  return 'enforce';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function signedHeaders(body: string) {
  if (!WAFFO_MERCHANT_ID || !WAFFO_PRIVATE_KEY) {
    throw new Error('waffo_credentials_missing');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyHash = createHash('sha256').update(body).digest('base64');
  const canonicalRequest = [
    'POST',
    WAFFO_SCAN_PATH,
    timestamp,
    bodyHash,
  ].join('\n');
  const signature = sign(
    'sha256',
    Buffer.from(canonicalRequest),
    WAFFO_PRIVATE_KEY
  ).toString('base64');

  return {
    'Content-Type': 'application/json',
    'X-Merchant-Id': WAFFO_MERCHANT_ID,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}

function unavailableResult(externalId?: string): ModerationResult {
  return {
    ok: false,
    decision: null,
    errorCode: 'moderation_unavailable',
    externalId,
  };
}

/**
 * Scan a prompt with Waffo before any generation or credit deduction.
 */
export async function moderatePrompt({
  prompt,
  externalId,
  locale,
}: ModeratePromptInput): Promise<ModerationResult> {
  const trimmed = (prompt ?? '').trim();

  // There is no user-controlled text to send. Image-only routes supply a
  // non-empty textual generation intent, so they still pass through Waffo.
  if (!trimmed) {
    return { ok: true, decision: 'allow', externalId, reasonCode: 'empty_input' };
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      decision: null,
      errorCode: 'prompt_too_long',
      externalId,
      reasonCode: 'prompt_too_long',
    };
  }

  if (!WAFFO_MERCHANT_ID || !WAFFO_PRIVATE_KEY) {
    if (ALLOW_DEV_BYPASS) {
      console.warn(
        '[moderation] Waffo credentials missing; bypassing only in non-production'
      );
      return {
        ok: true,
        decision: 'allow',
        externalId,
        reasonCode: 'development_bypass',
      };
    }

    console.error('[moderation] Waffo credentials missing in production');
    return unavailableResult(externalId);
  }

  const payload: {
    prompt: string;
    semantic: WaffoSemanticMode;
    locale?: WaffoLocale;
  } = {
    prompt: trimmed,
    semantic: WAFFO_SEMANTIC_MODE,
  };
  if (locale) payload.locale = locale;
  const body = JSON.stringify(payload);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let headers: ReturnType<typeof signedHeaders>;
    try {
      headers = signedHeaders(body);
    } catch (error) {
      console.error('[moderation] Waffo request signing failed', {
        externalId,
        message: error instanceof Error ? error.message : String(error),
      });
      return unavailableResult(externalId);
    }

    try {
      const response = await fetch(`${WAFFO_API_BASE}${WAFFO_SCAN_PATH}`, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      });

      if (response.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
        console.warn('[moderation] Waffo 5xx; retrying', {
          status: response.status,
          attempt: attempt + 1,
          externalId,
        });
        await delay(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      if (!response.ok) {
        // Waffo specifies no retry for 4xx. Authentication and malformed
        // responses fail closed so no prompt reaches a generation model.
        console.error('[moderation] Waffo non-2xx response', {
          status: response.status,
          externalId,
        });
        return unavailableResult(externalId);
      }

      const result = (await response.json()) as WaffoApiResponse;
      const verdict = result.data;
      const decision = verdict?.action;
      const requestId = verdict?.requestId;
      const common = {
        externalId,
        moderationId: requestId,
        requestId,
        reasonCode: verdict?.reasonCode,
        matchedCategories: verdict?.matchedCategories,
        semanticStatus: verdict?.semanticStatus,
      };

      if (decision === 'allow') {
        return { ok: true, decision, ...common };
      }

      if (decision === 'block') {
        console.warn('[moderation] Waffo blocked generation', {
          externalId,
          requestId,
          reasonCode: verdict?.reasonCode,
          matchedCategories: verdict?.matchedCategories,
        });
        return {
          ok: false,
          decision,
          errorCode: 'prompt_rejected',
          ...common,
        };
      }

      if (decision === 'review') {
        console.warn('[moderation] Waffo requires review', {
          externalId,
          requestId,
          reasonCode: verdict?.reasonCode,
        });
        return {
          ok: false,
          decision,
          errorCode: 'moderation_review',
          ...common,
        };
      }

      console.error('[moderation] Waffo returned an unknown verdict', {
        externalId,
        responseErrors: result.errors?.map((error) => error.message),
      });
      return unavailableResult(externalId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (attempt < MAX_ATTEMPTS - 1) {
        console.warn('[moderation] Waffo request failed; retrying', {
          attempt: attempt + 1,
          externalId,
          message,
        });
        await delay(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      console.error('[moderation] Waffo request failed closed', {
        externalId,
        message,
      });
      return unavailableResult(externalId);
    }
  }

  return unavailableResult(externalId);
}

/** Concatenate user-controlled text fields into one Waffo scan payload. */
export function combineUserText(
  parts: Array<string | null | undefined>
): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n\n');
}

/** Build the fail-closed API response consumed by generation routes. */
export function moderationErrorResponse(result: ModerationResult): NextResponse {
  if (result.errorCode === 'prompt_rejected') {
    return NextResponse.json(
      {
        error: 'prompt_rejected',
        message:
          '您的输入未通过内容安全审核，请修改后重试。Your input did not pass content safety screening. Please revise it and try again.',
        requestId: result.requestId,
        moderationId: result.moderationId,
      },
      { status: 400 }
    );
  }

  if (result.errorCode === 'prompt_too_long') {
    return NextResponse.json(
      {
        error: 'prompt_too_long',
        message:
          '提示词不能超过 10,000 个字符。The prompt cannot exceed 10,000 characters.',
      },
      { status: 400 }
    );
  }

  if (result.errorCode === 'moderation_review') {
    return NextResponse.json(
      {
        error: 'moderation_review',
        message:
          '该请求需要进一步审核，请稍后重试。This request requires additional review. Please try again later.',
        requestId: result.requestId,
        moderationId: result.moderationId,
      },
      {
        status: 503,
        headers: { 'Retry-After': '3600' },
      }
    );
  }

  return NextResponse.json(
    {
      error: 'moderation_unavailable',
      message:
        '内容安全服务暂时不可用，请稍后重试。Content safety service is temporarily unavailable. Please try again later.',
    },
    {
      status: 503,
      headers: { 'Retry-After': '30' },
    }
  );
}
