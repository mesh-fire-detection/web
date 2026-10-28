# Sign In, Join and Account

Status: implemented at `/sign-in`, `/join` and `/account`, covered by
automated tests against a stubbed API. Sign-in was tried by hand against a
local backend; joining was tried against the local API. Not yet tried against
the live API. The backend halves are `mesh-fire-detection/backend#31` (sign-in)
and the membership release (`docs/plans/membership.md` in the backend).

Not yet built: joining with a node (waits on device registration, backend#12),
Subscribe in the footer (backend#29), and Google (later).

## Purpose

Let a person who already has an account sign in with a code sent to their
email, see that they are signed in, and sign out. It is the first page of the
site that talks to the authenticated API, so it also sets the pattern later
signed-in pages follow: where the API address comes from, how the session is
read, and what a page does when nobody is signed in.

There is no open sign-up. A person becomes a member by joining with an address
an admin has invited (`/join`), or, once it is built, with a node they
connected (backend#9).

## Page placement and copy

- **Sign in** — route `/sign-in`, not in the primary nav.
- **Account** — route `/account`, not in the primary nav.
- Both are `unlisted` in `APP_ROUTES`: they get page shells like every route,
  but stay out of the sitemap.
- **Join** — route `/join`, listed in the sitemap: it is how people find their
  way in. Linked from **No account? Join** under the sign-in form.
- Header, signed out: a **Sign in** button in `header_actions`, beside
  **Build a Node**, using the `ghost` variant so the primary call to action
  stays primary.
- Header, signed in: the same slot shows the person's name, linking to
  `/account`. Long names truncate.
- The header shows neither until the session check has answered, so a signed-in
  person does not see **Sign in** flash on every load.
- The mobile drawer carries the same entry as its last item.

## Sign in flow

One page, two steps. The address persists between steps so the person never
retypes it.

1. **Email.** Field label **Email**, `type='email'`, `autoComplete='email'`.
   Action **Send code**. Intro: **We'll email you a six-digit code.**
2. **Code.** Intro: **If {address} can sign in, a code is on its way.** Then
   the limits, up front: **A code works once, for ten minutes, and allows
   three tries.** Field label **Code**, `inputMode='numeric'`,
   `autoComplete='one-time-code'` so phones offer it from the notification.
   Action **Sign in**. Secondary actions: **Send a new code** and **Use a
   different email**.

    **Send a new code** waits 30 seconds after each code, counting down on the
    button (**Send a new code in 27 s**): every request spends an email from a
    daily allowance everyone shares.

3. On success, go to where the person was headed (a `next` query parameter,
   same-site paths only), otherwise `/account`.

Visiting `/sign-in` while signed in goes straight to `/account`.

The email step always advances to the code step, whatever the address. The
backend answers an unknown address exactly as a known one and sends nothing,
so the page cannot tell them apart and must not pretend to — hence "if", never
"we sent". The code step's helper text covers the unknown case: **Nothing
after a few minutes? Check spam, or ask whoever invited you which address they
used.**

The code step is one component (`components/account/CodeStep`) shared with
Join, so both pages say the same limits, wait the same time and give the same
messages.

## Messages

| Backend response              | Shown at          | Message                                                                |
| ----------------------------- | ----------------- | ---------------------------------------------------------------------- |
| `INVALID_OTP`                 | Code field        | **That code doesn't match. Check it and try again.**                   |
| `OTP_EXPIRED`                 | Code field        | **That code has expired. Send a new one.**                             |
| `TOO_MANY_ATTEMPTS`           | Code field        | **Too many tries with that code. Send a new one.**                     |
| `NOT_INVITED` (Join only)     | Code field        | **This invitation is no longer open. Ask whoever invited you.**        |
| `429` from the rate limiter   | Form              | **Too many requests. Wait a few minutes and try again.**               |
| Network failure or `5xx`      | Form              | **Can't reach the server right now. Try again in a moment.**           |
| **Send a new code** succeeded | Code step, inline | **New code sent. The previous one no longer works.** Clears the field. |

Validation before submitting: the browser's own checks on the required email
field, then a full address (`name@host`); the code must be six digits after
stripping spaces, which people paste from email.

## Join flow

`/join` shows the two ways in side by side (backend#9).

- **I was invited** — email and **Your name**, with one plain line: **Joining
  also signs you up for occasional project updates. You can stop them at any
  time.** Action **Send code** calls `POST /v1/join`, which answers every
  address the same way. The code step then says **If {address} is on our list,
  a code is on its way.** and its action is **Join**, which calls Better Auth's
  `POST /v1/auth/email-otp/verify-email`; the backend makes the person a member
  as part of that and signs them in. On success, go to `next` or `/account`.
- **I've built a node** — joining with a node is not built yet, so this says so
  and offers **Connect a Node** (`/connect`) and **Ask for an invitation**
  (the contact address).
- **Already a member? Sign in** under both.

A member who asks to join is sent a sign-in code instead by the backend; the
page does not know and does not need to.

## Account page

- Requires a session. Signed out, it redirects to `/sign-in?next=/account`.
- Shows **Name**, **Email** and **Role** (`Admin` or `Member`) as read-only
  values, using the shared field-display components.
- Action **Sign out**: calls `POST /v1/auth/sign-out`, clears the cached
  session, and returns to `/`.
- Nothing is editable in this version.

## Implementation direction

- **API address.** A production build talks to `SITE.api`
  (`https://api.meshfiredetection.org`) and development to
  `http://localhost:3000`, chosen by Vite's build mode so no CI setting can be
  forgotten. `VITE_API_URL` overrides either, for pointing a local site at
  another backend.
- **Requests.** One small client in `src/core/` that sets
  `credentials: 'include'` and turns Better Auth's `{ code, message }` errors and
  rate-limit `429`s into a typed result. No auth SDK: the four calls are plain
  JSON and do not justify the dependency.
- **Session.** A `SessionProvider` beside the existing providers in
  `src/components/app/` calls `GET /v1/auth/get-session` once on load and
  exposes `loading | signed_out | signed_in(user)`. Signing in and out update it
  directly rather than reloading.
- **Cookies.** The API sets the session cookie on `api.meshfiredetection.org`.
  The site and API share `meshfiredetection.org`, so the cookie is same-site and
  travels with credentialed requests. Production CORS allows exactly
  `https://meshfiredetection.org`; a `www.` origin would be refused.
- **Copy** lives in `src/core/content/` mirroring the pages, as everywhere else.
- **Forms** use `Form`, `TextField` and `FormActions` from `shared/forms`; no
  new host elements.
- **Local development** needs the backend running with `DEV_CONSOLE=true` and no
  `RESEND_API_KEY`: codes then appear at `http://localhost:3000/dev/mail`
  instead of being emailed.

## Later additions

- Pages that need a session: alert rules, alerts, and admin pages for devices,
  gateways and inviting users.
- **Sign out everywhere**, once someone asks for it.
- Google sign-in and the Join and Subscribe routes from backend #9 and #29.

## Acceptance criteria

- A known address receives a code, and entering it signs in and lands on
  `/account` showing the right name, email and role.
- An unknown address reaches the code step and no email is sent.
- Each message in the table above appears for its case, covered by tests that
  stub the API.
- Reloading any page keeps the person signed in; **Sign out** ends the session,
  and `/account` then redirects to `/sign-in`.
- `/sign-in?next=https://example.com` lands on `/account`, not off-site.
- The header never shows **Sign in** to a signed-in person, even briefly.
- Keyboard only: the whole flow works with Tab, Enter and Space, and focus moves
  to the code field when the code step appears.
- `npm run check` passes.
