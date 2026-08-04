# Waffo Pancake Payments

This project uses `@waffo/pancake-ts` for one-time credit recharge payments.
The app creates a pending local order first, opens Waffo checkout in a new tab,
and credits points only after a signed `order.completed` webhook.

## Environment

Fill these values in `.env.local`:

```env
WAFFO_MERCHANT_ID=MER_7bMtmXUTKAbkCvTu0Kf3Uk
WAFFO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WAFFO_ENVIRONMENT=test
WAFFO_STORE_ID=STO_xxx
WAFFO_PRODUCT_ID_CREATOR=PROD_xxx
WAFFO_PRODUCT_ID_ENTHUSIAST=PROD_xxx
WAFFO_PRODUCT_ID_STUDIO=PROD_xxx
```

`WAFFO_PRIVATE_KEY` must stay server-side. Do not use a `NEXT_PUBLIC_` prefix.

## Products

Create four one-time products in the Pancake Dashboard, or run the optional
setup script after `WAFFO_STORE_ID` and `WAFFO_PRIVATE_KEY` are real:

```bash
npm run waffo:setup
```

The script creates:

| Plan | Price | Points | Env variable |
| --- | ---: | ---: | --- |
| Creator | USD 1.00 | 300 | `WAFFO_PRODUCT_ID_CREATOR` |
| Enthusiast | USD 49.90 | 700 | `WAFFO_PRODUCT_ID_ENTHUSIAST` |
| Studio | USD 99.90 | 1500 | `WAFFO_PRODUCT_ID_STUDIO` |

The setup script is intended for first-time setup. Re-running it can create
duplicate products in Waffo.

## Webhook

Register this webhook in Waffo for the same Store ID:

```text
https://loveshow.life/api/webhooks/waffo
```

Subscribe to:

```text
order.completed
```

For sandbox testing, keep `WAFFO_ENVIRONMENT=test` and set the webhook to test
mode. The handler verifies the Waffo signature, Store ID, environment, order
metadata, currency, amount, and plan points before fulfilling.

## Test Checkout

1. Sign in to LoveShow.
2. Open `/en/dashboard/billing` or `/zh/dashboard/billing`.
3. Click a paid recharge plan.
4. Waffo checkout opens in a new tab.
5. Use Waffo sandbox cards:

```text
Success:  4576750000000110
Decline:  4576750000000220
```

Use any future expiry date and CVC during sandbox checkout.
