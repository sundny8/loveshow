# Waffo Content Safety Integration

LoveShow scans every user prompt or textual AI-generation intent before credit
deduction and before invoking an image, text, or music model.

Official endpoint:

- `POST https://api.waffo.ai/v1/actions/verification/scan-prompt`
- Documentation: https://docs.waffo.ai/zh/api-reference/endpoints/content-safety/scan-prompt

## Authentication

`src/lib/moderation.ts` implements Waffo's documented RSA-SHA256 API Key
authentication with these headers:

- `X-Merchant-Id`
- `X-Timestamp`
- `X-Signature`
- `Content-Type: application/json`

The signature covers the method, exact path, Unix timestamp, and base64 SHA-256
hash of the exact JSON body sent to Waffo. The private key remains server-side.

## Decision handling

The integration uses `semantic: "enforce"` by default and follows a strict
fail-closed contract:

- `allow`: continue to credit deduction and model invocation.
- `review`: stop generation and return a retryable response.
- `block`: stop generation and return a policy rejection.
- Missing credentials, timeout, 4xx authentication/configuration errors,
  exhausted 5xx retries, malformed JSON, or unknown action: stop generation.

Waffo 5xx/network failures are retried up to three times after the initial
attempt, with 5s, 10s, and 20s delays. Prompts over Waffo's 10,000-character
limit are rejected locally without truncation.

Waffo documents that prompt scanning is stateless and does not retain the
original prompt after returning a verdict. Local logs contain correlation IDs,
verdict metadata, and Waffo request IDs, but never the prompt text.

## Covered generation routes

The following routes call `moderatePrompt()` before generation or charging:

1. `/api/photo/generate`
2. `/api/photo/batch`
3. `/api/portrait/generate`
4. `/api/music/generate`
5. `/api/love-column/analysis`
6. `/api/love-column/copy`
7. `/api/love-column/memoir`
8. `/api/love-column/couple-photo`
9. `/api/love-column/couple-avatar`
10. `/api/tasks/generate`

Image-only flows construct a textual generation intent from their selected
style/specification so the request still passes through Waffo before the model.

## Production configuration

Create a Production API Key in Waffo Dashboard → API & Development → API Keys,
then configure:

```env
WAFFO_MERCHANT_ID=MER_xxxxxxxxxxxxxxxxxx
WAFFO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WAFFO_CONTENT_SAFETY_SEMANTIC=enforce
```

Optional API base override:

```env
WAFFO_API_BASE=https://api.waffo.ai
```

Production does not permit a missing-key bypass. Non-production environments
may bypass only when credentials are absent so local UI development remains
possible.

## Verification

Before deploying:

1. Confirm the Waffo production API key is active and the server clock uses NTP.
2. Submit a benign prompt and verify generation proceeds only after `allow`.
3. Submit a prohibited prompt and verify no credits are charged and no model is called.
4. Temporarily use an invalid key and verify the API returns 503 without generation.
5. Save Waffo `requestId` values for support and appeals without logging prompts.

This integration covers the required pre-generation prompt scan. Generated
outputs remain subject to the safety controls of the underlying model providers
and LoveShow's separate output-policy review described in the AUP.
