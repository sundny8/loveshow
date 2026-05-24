# Content Moderation Compliance — LoveShow 520

This document confirms that **Creem's Content Moderation API** is integrated
across **every prompt-based generation endpoint** on this platform, in
accordance with Creem's Content Safety & Moderation Requirements:

- https://docs.creem.io/features/moderation
- https://docs.creem.io/merchant-of-record/account-reviews/account-reviews#content-safety-&-moderation-requirements

## Where moderation runs

A single shared client lives at `src/lib/moderation.ts`. It calls
`POST https://api.creem.io/v1/moderation/prompt` with the user-supplied free
text and an `external_id` of the form `user_<userId>:<kind>` for auditing.

The client is invoked **before any billing or model call** in every endpoint
where a user-supplied prompt is forwarded to an AI generation model:

| Endpoint | Path | Type | User text screened |
|---|---|---|---|
| Love copywriting | `src/app/api/love-column/copy/route.ts` | Text → text | `keyword`, `scenario` |
| Relationship analysis | `src/app/api/love-column/analysis/route.ts` | Image + text → text | `metAt`, `note` |
| Couple photo | `src/app/api/love-column/couple-photo/route.ts` | Image + text → image | `note` |
| Couple avatar | `src/app/api/love-column/couple-avatar/route.ts` | Image + text → image | `note` |
| Love memoir | `src/app/api/love-column/memoir/route.ts` | Image + text → text | `title`, `timeline`, `chat`, `note` |
| Music generation | `src/app/api/music/generate/route.ts` | Text → audio | `prompt`, `title`, `style`, `mood`, `vocalStyle` |

### Endpoints that intentionally do not call moderation

The following endpoints do **not** accept any user-supplied free-text prompt —
they only accept a reference image plus an enum value selected from a fixed
list (e.g. `styleId=studio_portrait`). All textual prompts are server-side,
hard-coded, and reviewable in the repository:

| Endpoint | Path | Inputs |
|---|---|---|
| Single-person portrait | `src/app/api/portrait/generate/route.ts` | image + `styleId` (enum) |
| ID photo (single) | `src/app/api/photo/generate/route.ts` | image + `specId`/`bgColor`/`suit` (enum) |
| ID photo (batch) | `src/app/api/photo/batch/route.ts` | images + `specId`/`bgColor`/`suit` (enum) |

Because the user cannot inject any free-text prompt into these endpoints,
there is no user-supplied text for the Moderation API to screen. The fixed
server-side prompts are checked-in to the repository and shown in the public
landing pages for transparency.

## Behavior contract

All moderation calls in this platform follow the contract specified in
Creem's documentation:

1. **Pre-flight**: moderation runs after parameter validation but **before**
   point deduction, record creation, or any model invocation.
2. **`deny` blocks**: the user receives a 400 with `error: 'prompt_rejected'`.
3. **`flag` blocks**: treated identically to `deny`, per Creem's recommendation
   ("We recommend treating `flag` exactly like `deny`").
4. **Fail closed**: any non-2xx, network error, timeout (5s), missing API key
   in production, or unknown decision value returns 503 with
   `error: 'moderation_unavailable'`. Generation never proceeds in those cases.
5. **Forward-compat**: unknown extra fields in the response body are ignored;
   only the documented `decision` enum is consumed.
6. **Audit trail**: every call sends `external_id = user_<userId>:<kind>`.
   Server logs include the returned moderation result `id` on every block.

The check is idempotent and stateless — repeated retries with the same
prompt make repeated screening calls.

## Source-side controls

Beyond the per-request screening, the platform also enforces:

- **Acceptable Use Policy** (Section 7 of `src/app/[locale]/terms/page.tsx`):
  explicit prohibition of NSFW, sexually explicit, illegal, hateful, or
  harmful content generation.
- **Server-side prompt construction**: image-generation prompts are built on
  the server (`src/lib/photo/portrait-pipeline.ts`,
  `src/lib/love-column/prompts/*`). Users cannot bypass the prompt template
  to inject arbitrary instructions into the model.
- **Reference-image use only for likeness**: image inputs are used only as
  visual reference for the subject, never as a vehicle for arbitrary
  instructions.

## Configuration

Production deployment must set `CREEM_API_KEY`. See `.env.example` for the
documented variable name. Production environments without a key fail closed
(503 to all generation endpoints).

```env
# .env.local (production)
CREEM_API_KEY=creem_xxxxxxxxxxxxxxxxxx
# Optional override; defaults to https://api.creem.io
# CREEM_API_BASE=https://api.creem.io
```

## How to verify

A submission to any of the above endpoints with an obviously policy-violating
prompt (e.g. NSFW request) will:

1. Be sent to `POST /v1/moderation/prompt` with the user's text.
2. Receive a `deny` (or `flag`) decision.
3. Return HTTP 400 with `{"error":"prompt_rejected", ...}`.
4. **Never** be forwarded to the underlying generation model.
5. **Never** charge the user any points.

A network failure to the Moderation API will instead return HTTP 503 with
`{"error":"moderation_unavailable", ...}` and likewise never reach the model.
