import { apiRequest, type ApiResult } from '@core/api/client'

/** The signed-in person, as the API describes them. Fields the site does not read are omitted. */
export type SessionUser = {
    readonly id: string
    readonly name: string
    readonly email: string
    readonly role: 'admin' | 'user'
    /** When the account was made, ISO 8601. */
    readonly createdAt: string
}

/** One place the person is signed in. The API never sends the token. */
export type MySession = {
    readonly id: string
    /** This browser. */
    readonly current: boolean
    readonly userAgent: string | null
    readonly createdAt: string
    /** Renewed by use at most once a day, so accurate to the day. */
    readonly lastActiveAt: string
}

/** The emailed code is always one, and never removable. */
export type SignInMethod = {
    readonly kind: 'code' | 'google'
    readonly removable: boolean
}

const AUTH = '/v1/auth'

/**
 * Asks for a sign-in code. The API answers an address with no account exactly
 * as one with an account and sends nothing, so success here means "accepted",
 * never "an email is on its way".
 */
export function requestCode(email: string): Promise<ApiResult<unknown>> {
    return apiRequest(`${AUTH}/email-otp/send-verification-otp`, {
        method: 'POST',
        body: { email, type: 'sign-in' },
    })
}

export async function signInWithCode(email: string, code: string): Promise<ApiResult<SessionUser>> {
    const result = await apiRequest<{ user: SessionUser }>(`${AUTH}/sign-in/email-otp`, {
        method: 'POST',
        body: { email, otp: code },
    })
    return result.ok ? { ok: true, data: result.data.user } : result
}

/**
 * Asks to join, saying this browser has connected a node. The nodes themselves
 * are sent only once the person is a member (`addMyNodes`). The API answers
 * every address the same way; a member gets a sign-in code instead.
 */
export function requestJoin(email: string, name: string): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/join', { method: 'POST', body: { email, name, withNode: true } })
}

/**
 * Exchanges a join code for membership. It is Better Auth's email check, and
 * the backend makes the person a member as part of it, then signs them in.
 */
export async function joinWithCode(email: string, code: string): Promise<ApiResult<SessionUser>> {
    const result = await apiRequest<{ user: SessionUser }>(`${AUTH}/email-otp/verify-email`, {
        method: 'POST',
        body: { email, otp: code },
    })
    return result.ok ? { ok: true, data: result.data.user } : result
}

/**
 * Starts signing in with Google. The API answers with Google's address, which
 * the caller then opens. Google sends the person back to `done` once signed
 * in, or to `refused` with `?error=` when the backend turned them away; both
 * are full URLs on this site. Joining with a node says so, as `requestJoin`
 * does, and Google then lets someone eligible become a member.
 */
export async function startGoogle(options: {
    readonly done: string
    readonly refused: string
    readonly withNode?: boolean
}): Promise<ApiResult<string>> {
    const result = await apiRequest<{ url: string }>(`${AUTH}/sign-in/social`, {
        method: 'POST',
        body: {
            provider: 'google',
            callbackURL: options.done,
            errorCallbackURL: options.refused,
            ...(options.withNode === true && { additionalData: { withNode: true } }),
        },
    })
    return result.ok ? { ok: true, data: result.data.url } : result
}

/** `null` means nobody is signed in; the API answers that with a `200` and an empty session. */
export async function fetchSession(): Promise<ApiResult<SessionUser | null>> {
    const result = await apiRequest<{ user: SessionUser } | null>(`${AUTH}/get-session`)
    return result.ok ? { ok: true, data: result.data?.user ?? null } : result
}

export function signOut(): Promise<ApiResult<unknown>> {
    return apiRequest(`${AUTH}/sign-out`, { method: 'POST', body: {} })
}

/** Renames the signed-in member. The address is how they sign in, so it cannot change here. */
export async function renameMe(name: string): Promise<ApiResult<SessionUser>> {
    const result = await apiRequest<{ user: SessionUser }>('/v1/me', {
        method: 'PATCH',
        body: { name },
    })
    return result.ok ? { ok: true, data: result.data.user } : result
}

export async function fetchMySessions(): Promise<ApiResult<readonly MySession[]>> {
    const result = await apiRequest<{ sessions: MySession[] }>('/v1/me/sessions')
    return result.ok ? { ok: true, data: result.data.sessions } : result
}

/** Ends one session, which may be on another device. */
export function endMySession(id: string): Promise<ApiResult<unknown>> {
    return apiRequest(`/v1/me/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Signs the person out on every device, this one included. */
export function signOutEverywhere(): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/me/sessions', { method: 'DELETE' })
}

export async function fetchMySignInMethods(): Promise<ApiResult<readonly SignInMethod[]>> {
    const result = await apiRequest<{ methods: SignInMethod[] }>('/v1/me/sign-in-methods')
    return result.ok ? { ok: true, data: result.data.methods } : result
}

/**
 * Starts adding Google to the signed-in account. The API answers with
 * Google's address, which the caller opens; Google sends the person back to
 * `back`, a full URL on this site, with `?error=` if it could not be added.
 * Only a Google account with the same address can be added.
 */
export async function startLinkingGoogle(back: string): Promise<ApiResult<string>> {
    const result = await apiRequest<{ url: string }>(`${AUTH}/link-social`, {
        method: 'POST',
        body: { provider: 'google', callbackURL: back, errorCallbackURL: back },
    })
    return result.ok ? { ok: true, data: result.data.url } : result
}

/** Removes Google. The emailed code still works, so this never locks anyone out. */
export function removeGoogle(): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/me/sign-in-methods/google', { method: 'DELETE' })
}

/**
 * Deletes the signed-in account and every session it has. `conflict` means
 * the person is the only admin.
 */
export function deleteMe(): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/me', { method: 'DELETE' })
}
