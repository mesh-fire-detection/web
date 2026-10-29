# Sign In, Join and Account

Status: implemented at `/sign-in`, `/join`, `/account` and
`/subscribe/confirm`, with the membership prompt on `/connect` and the footer's
sign-up, covered by automated tests against a stubbed API. Sign-in was tried by
hand against a local backend; joining with a node and subscribing were tried
against the local API. Not yet tried against the live API. The backend halves
are `mesh-fire-detection/backend#31` (sign-in) and the membership release
(`docs/plans/membership.md` in the backend).

Not yet built: Google (later), and unsubscribe links in update emails, which
arrive with the first update.

## Purpose

Let a person who already has an account sign in with a code sent to their
email, see that they are signed in, and sign out. It is the first page of the
site that talks to the authenticated API, so it also sets the pattern later
signed-in pages follow: where the API address comes from, how the session is
read, and what a page does when nobody is signed in.

There is no open sign-up. The website's way in is a node: someone who has
connected one on `/connect` joins at `/join` (backend#9). An address an admin
invited can also join, through the API; the website no longer offers that
route.

## Page placement and copy

- **Sign in** — route `/sign-in`, not in the primary nav.
- **Account** — route `/account`, not in the primary nav.
- Both are `unlisted` in `APP_ROUTES`: they get page shells like every route,
  but stay out of the sitemap.
- **Join** — route `/join`, titled **Become a member**, listed in the sitemap.
  Linked from **No account? Join** under the sign-in form, from the prompt on
  `/connect`, and from the footer.
- **Confirm your updates** — route `/subscribe/confirm`, `unlisted`, opened from
  the confirmation email.
- Header, signed out: a **Join** button in `header_actions`, linking to
  `/join`, beside **Build a Node**, using the `ghost` variant so the primary
  call to action stays primary. Members reach sign-in from the join page.
- Header, signed in: the same slot shows a person icon labelled **Account**,
  linking to `/account`. Never the person's name: it is long, personal, and
  shown to anyone looking at the screen. The drawer shows the icon with the
  word.
- The nav never shrinks below its links; the wordmark truncates instead, so the
  header cannot overlap itself.
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

Membership is for people building the network, so `/join` starts from the
nodes this browser has connected.

- **No node connected here yet** — **Start by connecting your node**, saying
  the node stays in the browser and nothing is sent until they join, with
  **Connect a Node** (`/connect`). No form.
- **One or more nodes connected** — **Your details** (email, **Your name**, and
  the plain line **Joining also signs you up for occasional project updates.
  You can stop them at any time.**, which the backend records as consent) beside
  **Nodes from this browser**, listing them by name and Meshtastic ID. **Send
  code** calls `POST /v1/join` with `withNode: true` and answers every address
  the same way. The code step says **If {address} can join, a code is on its
  way.**; **Join** calls Better Auth's `POST /v1/auth/email-otp/verify-email`,
  which makes the person a member and signs them in. Only then do the nodes
  leave the browser: `POST /v1/me/nodes`, before the page moves on to `next`
  or `/account`, so the account page already shows them. If that call fails,
  the nodes are still in the browser and `/connect` offers to add them.
- **Already a member? Sign in** under both.

"Connected" is what `/connect` already remembers in `localStorage`: every
device it has identified with a node number. No cookie is needed, because
nothing has to reach the server until the person joins.

A member who asks to join is sent a sign-in code instead by the backend; the
page does not know and does not need to.

## Becoming a member from `/connect`

Once a node has connected and identified itself, the page's aside shows a
prompt:

- **Signed out** — **Become a member**: the node is connected, members keep
  their nodes and get updates, and this browser remembers them until then.
  **Become a member** goes to `/join`; **Already a member? Sign in** returns
  to `/connect` afterwards.
- **Signed in** — **Add to my account** for the nodes not on it yet, compared
  against `GET /v1/me/nodes`; **Every node here is on your account.** once
  they all are. Adding is a deliberate act, never automatic.

## Updates

- **Footer, every page** — the one ask, adapting to the reader. Signed in:
  nothing. A browser that has connected a node: **Become a member**, linking to
  `/join`, since joining includes updates. Everyone else: **Get updates**, an
  email field, the line **Occasional project updates by email. Confirm by the
  link we send; stop any time.** (recorded as consent) and **Subscribe**, which
  calls `POST /v1/subscribe` and then says only **Check your inbox to
  confirm.** The footer follows `/connect` in another tab through the
  `storage` event.
- **`/subscribe/confirm?token=…`** — confirms on **Confirm subscription**,
  never on load, since mail scanners open links first. A used or wrong link:
  **This link is invalid or has already been used.**
- **Account** — the updates setting, on or off, without a confirmation email.

## Account page

- Requires a session. Signed out, it redirects to `/sign-in?next=/account`.
- **Name** is editable, with **Save** (disabled until it changes; `PATCH
/v1/me`), and **Saved.** once it is. The header and session update at once.
- **Email** is shown but not editable: **You sign in with this address, so it
  cannot be changed here.**
- No role is shown, for now.
- **Your nodes** — from `GET /v1/me/nodes`, or a pointer to `/connect`.
- **Updates** — on or off (`PATCH /v1/me/subscription`).
- Action **Sign out**: calls `POST /v1/auth/sign-out`, clears the cached
  session, and returns to `/`.

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
