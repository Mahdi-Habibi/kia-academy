# Kia Academy rebuild — architecture (Step 0)

Kia Academy is being rebuilt as **آکادمی کیا (Kia Academy)**: a Persian-first learning platform for Iran.

## Product shape

| Path | Audience | Auth |
| --- | --- | --- |
| `/` | Everyone | Public landing (header + short copy + 2 CTAs) |
| `/material` | Everyone | Public Material Studio (ported from Kia uploads) |
| `/education` → phone → OTP → profile → start | Learners | Iranian phone OTP |
| `/assessment` | Learners with complete profile | JWT session |
| `/learn/...` | Enrolled learners | JWT; Kia-style lesson UI + video |

## Technical decisions

1. **Default locale:** `fa` (RTL). Other locales remain available but Persian is primary.
2. **Material Studio:** Client-only feature under `apps/web/src/features/material/`. UI preserved; code split into data / utils / state / panels for maintainability. No Nest dependency.
3. **Education auth:** Phone-first OTP (Iranian `09xxxxxxxxx` / `+989…`). Email+password kept for admin/seed compatibility.
4. **Profile gate:** After OTP, required profile (`firstName`, `lastName`, `city`, `email`); phone read-only. XSS/spam sanitization on text fields.
5. **OTP delivery:** Real SMS provider optional. In development, OTP is logged and returned in API response when `OTP_DEV_EXPOSE=true` (default in development).
6. **Payments:** IRR/Toman display; Stripe optional/legacy. Checkout amounts stored as IRR (integer rials). Gateway can be mocked until a real Iran PSP is wired.
7. **Lessons:** Kia Learn-inspired layout + HTML5 video with controls and fullscreen; keep Nest course/lesson APIs.

## Validation rules

- **Phone:** normalize to `09xxxxxxxxx`; accept `+98`, `98`, `0` prefixes.
- **OTP:** 6 digits; TTL 5 minutes; max attempts enforced server-side.
- **Email:** standard format; reject HTML/script-like payloads.
- **Name/city:** letters, spaces, Persian letters; reject URLs, `<script>`, control chars; length caps.
