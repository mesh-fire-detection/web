# Sign In and Account

Status: first version implemented at `/sign-in` and `/account`, covered by
automated tests against a stubbed API and tried by hand against a local
backend. Not yet tried against the live API. The backend half shipped in
`mesh-fire-detection/backend#31`; this page is the website half.

Still owed to web#3, and due in the membership release
(`docs/plans/membership.md` in the backend):

- A visible cooldown on **Send a new code**.
- Code-step copy that does not imply a code was sent: **If that address can
  sign in, a code is on its way.** The current wording names the address as if
  the email went out, which tells someone it has an account.
- Saying **three attempts** up front, not only after the third.
- A **No account? Join** link to `/join`.

## Purpose

Let a person who already has an account sign in with a code sent to their
email, see that they are signed in, and sign out. It is the first page of the
site that talks to the authenticated API, so it also sets the pattern later
signed-in pages follow: where the API address comes from, how the session is
read, and what a page does when nobody is signed in.

There is no open sign-up. An account exists because an admin created it
(backend `POST /v1/users`, or `createAdmin` on the server). How else a person
becomes an account is backend issues #9 and #29, and out of scope here.

## Page placement and copy

- **Sign in** — route `/sign-in`, not in the primary nav.
- **Account** — route `/account`, not in the primary nav.
- Both are `unlisted` in `APP_ROUTES`: they get page shells like every route,
  but stay out of the sitemap.
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
2. **Code.** Intro: **Enter the code we sent to {address}. It expires in ten
   minutes.** Field label **Code**, `inputMode='numeric'`,
   `autoComplete='one-time-code'` so phones offer it from the notification.
   Action **Sign in**. Secondary actions: **Send a new code** and **Use a
   different email**.
3. On success, go to where the person was headed (a `next` query parameter,
   same-site paths only), otherwise `/account`.

Visiting `/sign-in` while signed in goes straight to `/account`.

The email step always advances to the code step, whatever the address. The
backend answers an unknown address exactly as a known one and sends nothing,
so the page cannot tell them apart and must not pretend to. The code step's
helper text covers that case: **No email? Check spam, or ask whoever invited
you whether your account uses this address.**

## Messages

| Backend response              | Shown at          | Message                                                               |
| ----------------------------- | ----------------- | --------------------------------------------------------------------- |
| `INVALID_OTP`                 | Code field        | **That code doesn't match. Check it and try again.**                  |
| `OTP_EXPIRED`                 | Code field        | **That code has expired. Send a new one.**                            |
| `TOO_MANY_ATTEMPTS`           | Code field        | **Too many tries with that code. Send a new one.**                    |
| `429` from the rate limiter   | Form              | **Too many requests. Wait a few minutes and try again.**              |
| Network failure or `5xx`      | Form              | **Can't reach the server right now. Try again in a moment.**          |
| **Send a new code** succeeded | Code step, inline | **New code sent.** Clears the field. The previous code stops working. |

Validation before submitting: the email field must contain an `@`; the code
must be six digits after stripping spaces, which people paste from email.

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
