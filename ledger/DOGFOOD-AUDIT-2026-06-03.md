# DomCafe Dogfood Audit — 2026-06-03

## Scope

Audited the live local Docker-served DomCafe app at `http://localhost:11080` after the current frontend rebuild. The audit focused on three improvement tracks:

1. Security enhancement signals visible from routes, headers, authentication boundaries, and token handling.
2. UI improvement opportunities on the welcome, menu, cart, order status, and admin login surfaces.
3. Usability improvement opportunities across the guest order flow and admin entry flow.

## Verified baseline

- Docker stack was running through Nginx on `0.0.0.0:11080`.
- App routes responded: `/`, `/menu`, `/cart`, `/admin`, `/api/health`.
- Health endpoint returned OK for application, database, and Redis.
- Frontend tests passed: 29/29.
- Backend tests passed: 67/67.
- No browser console errors were observed during the audited route visits and interactions.
- Public HTML response included: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Unauthenticated admin API calls returned `401` with a generic message and `Cache-Control: no-store`.

## Positive findings

### Guest flow is functionally intact

The basic flow works:

`Welcome -> Menu -> Add drink -> Cart -> Submit order -> Order status`

A test order was successfully submitted from the live app and opened an order status page.

### Menu add feedback is live

Clicking `Add to order` updates the clicked drink button to `Order is Added` and increments the review-order count. This confirms the recent menu feedback PR is visible in the rebuilt Docker frontend.

### Cart quantity controls are clearer than before

The minus/value/plus control is easier to understand than a native number field and prevents going below 1.

### Admin API boundary is protected

Unauthenticated requests to admin APIs returned `401` with a generic login-required response. This is the right behavior.

### Test coverage is healthy

The frontend and backend test suites both pass in the current working tree.

---

# Findings and recommended PRs

## P1 — Add visible validation feedback when guest name is empty

**Category:** Usability / Accessibility  
**Severity:** Medium  
**Surface:** Welcome page

### Evidence

The welcome page Start button is enabled even when the name field is empty. The code prevents navigation when the name is blank, but it does not show a visible error message. To the guest, pressing Start with an empty name appears to do nothing.

Relevant implementation behavior:

```tsx
if (!name.trim() || !activeSettings.orders_open) return;
```

The input also does not currently use `required`, so the browser does not provide native required-field feedback either.

### Why it matters

This is one of the first interactions in the guest flow. If the first button seems broken, the user may think the app is not working.

### Suggested fix

Small PR:

- Add `required` to the guest name input.
- Add a small branded error message such as: `Please enter your name before starting.`
- Optionally disable Start until `name.trim()` is present.
- Keep it visually quiet and aligned with the current welcome card.

---

## P2 — `/admin` should not fall back to the public welcome page

**Category:** Usability / Admin route clarity  
**Severity:** Medium  
**Surface:** Admin routing

### Evidence

Opening `/admin` renders the public welcome page instead of redirecting or routing to admin login/dashboard. The current route switch handles `/admin/login`, `/admin/dashboard`, `/admin/beans`, `/admin/menu`, `/admin/orders`, and `/admin/settings`, then falls back to the welcome page for everything else.

Relevant route behavior:

```tsx
if (path === '/admin/login') return <AdminLoginPage navigate={navigate} />;
if (path === '/admin/dashboard') return <AdminDashboardPage />;
...
return <WelcomePage navigate={navigate} />;
```

### Why it matters

Admins will naturally try `/admin`. Seeing the public guest screen is confusing. It also makes the admin entry point feel unfinished.

### Suggested fix

Small PR:

- Add explicit `/admin` handling.
- If there is no admin token, show `/admin/login`.
- If there is an admin token, route to `/admin/dashboard`.

---

## P3 — API error responses are missing the same security headers as the public HTML response

**Category:** Security hardening  
**Severity:** Medium  
**Surface:** Nginx/API responses

### Evidence

The public HTML response includes the expected security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

The unauthenticated admin API response returned only:

- `Cache-Control: no-store`

It did not include the same security headers in the captured response.

### Why it matters

Security headers should be consistently applied across all same-origin responses, including API errors and `401` responses. In Nginx this often requires `add_header ... always;` in the relevant location/server scope.

### Suggested fix

Small PR:

- Ensure the security headers apply to `/api/` responses too.
- Use `always` so headers are also present on 4xx/5xx responses.
- Verify with `curl -i /api/admin/orders` while unauthenticated.

---

## P4 — Menu has too many placeholder drink images

**Category:** UI polish / Product clarity  
**Severity:** Medium  
**Surface:** Menu page

### Evidence

The first few drinks have real coffee photos, but most drink cards show the beige DŌM placeholder image. Because the menu is visual and drink cards are image-heavy, repeated placeholders reduce perceived quality.

### Why it matters

For a home café ordering experience, guests make decisions visually. Placeholder repetition makes the menu feel less complete than the rest of the polished UI.

### Suggested fix

Content/UI PR options:

- Replace placeholders with real drink photos for the common drinks first.
- Or make the placeholder presentation intentionally premium: smaller wordmark, subtle pattern, category-specific tint, or no image block for missing photos.
- Add an admin hint for missing photos on the admin menu side.

---

## P5 — Long menu page needs stronger navigation while scrolling

**Category:** Usability  
**Severity:** Medium  
**Surface:** Menu page

### Evidence

The menu page is long: 22 drinks across 5 sections. Category chips are useful at the top, but once the user scrolls deep into the list, the category navigation and review-order button are no longer visible.

### Why it matters

Guests may need to jump between Espresso, Cold Bar, Capsule Bar, and Special Menu. They also need a clear path back to reviewing the order after adding items.

### Suggested fix

Small-to-medium PR:

- Make category chips sticky under the top area, or add a compact sticky bottom action bar after an item is added.
- Keep the current quiet visual style; avoid heavy decorative UI.
- Ensure mobile behavior is tested carefully.

---

## P6 — Order status page should make live updating clearer

**Category:** Usability  
**Severity:** Medium/Low  
**Surface:** Order status page

### Evidence

The status page says: `We'll keep this page updated while your drink moves through the bar.` The progress states are visible and clean, but the page does not show polling interval, last updated time, or manual refresh affordance.

### Why it matters

A guest waiting for a drink may wonder whether the page is actively connected, stale, or needs refresh.

### Suggested fix

Small PR:

- Add quiet microcopy: `Updates automatically every 15 seconds.`
- Optionally show `Last checked just now`.
- Optionally add a small `Refresh status` button.

---

## P7 — Cart note fields could be clearer

**Category:** Usability / Copy  
**Severity:** Low  
**Surface:** Cart page

### Evidence

Each item has a `Note` field, and the whole order has `Order note`. This is technically correct, but guests may not immediately understand the difference.

### Why it matters

Guests may put drink-specific instructions in the order note or general instructions in an item note. This is not catastrophic, but clearer copy would reduce confusion.

### Suggested fix

Small PR:

- Rename item note label to `Drink note`.
- Add placeholder examples:
  - Drink note: `Less ice, extra hot...`
  - Order note: `Anything the bar should know...`

---

## P8 — Admin logged-out protected page is too bare

**Category:** UI / Usability  
**Severity:** Low  
**Surface:** `/admin/dashboard` when logged out

### Evidence

Opening `/admin/dashboard` without a token shows only:

- `Admin login required.`
- `Go to login`

It works, but visually it feels much less polished than the admin login page.

### Why it matters

This is an admin-only surface, but it still affects perceived quality and clarity.

### Suggested fix

Small PR:

- Render the same branded admin card shell as login.
- Keep message generic.
- Include one clear `Go to login` button.

---

## P9 — Admin token storage should be reviewed for future hardening

**Category:** Security hardening  
**Severity:** Low/Medium depending on threat model  
**Surface:** Admin authentication

### Evidence

The admin login stores the bearer token in `localStorage`:

```tsx
window.localStorage.setItem('dom_admin_token', token.access_token);
```

### Why it matters

For a private home café app, this may be acceptable short-term. For stronger hardening, `localStorage` tokens are more exposed to XSS than `HttpOnly` secure cookies.

### Suggested fix

Future security PR, not necessarily urgent:

- Evaluate moving admin auth to `HttpOnly`, `SameSite`, secure cookies.
- If staying with `localStorage`, keep CSP/XSS hardening and avoid any unsafe HTML injection.

---

# Recommended implementation order

## PR 1 — First-impression usability fixes

Bundle:

1. Empty guest name validation feedback.
2. `/admin` route redirects/resolves correctly.
3. Bare protected-admin logged-out page polish.

Why first: small changes, high perceived quality improvement, low risk.

## PR 2 — Security header hardening

Bundle:

1. Apply standard security headers to API responses.
2. Verify 401 responses include headers.
3. Keep no-cache/no-store behavior for sensitive admin API responses.

Why second: focused security hardening with easy curl verification.

## PR 3 — Menu usability polish

Bundle:

1. Sticky category navigation or compact review-order affordance.
2. Better missing-photo treatment.
3. Verify desktop and narrow viewport behavior.

Why third: more visual and layout-sensitive, should be screenshot verified.

## PR 4 — Waiting/status clarity

Bundle:

1. Add auto-update interval copy.
2. Add last-checked or refresh affordance if simple.
3. Clarify cart note labels/placeholders.

Why fourth: low-risk UX polish that improves confidence after ordering.

# Final audit verdict

DomCafe is already functional and visually coherent. The main guest order flow works, tests pass, admin APIs are protected, and the recent add-to-order feedback is live after rebuild.

The highest-value improvements now are not large features. They are small polish/hardening tasks that remove confusion:

- Tell the guest why Start did not proceed.
- Make `/admin` behave like an admin entry point.
- Apply security headers consistently to API responses.
- Make long-menu navigation and order-status waiting clearer.
