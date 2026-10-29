import { apiRequest, type ApiResult } from '@core/api/client'

/** The signed-in person, as the API describes them. Fields the site does not read are omitted. */
export type SessionUser = {
    readonly id: string
    readonly name: string
    readonly email: string
    readonly role: 'admin' | 'user'
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
