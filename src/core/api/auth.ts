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

/** `null` means nobody is signed in; the API answers that with a `200` and an empty session. */
export async function fetchSession(): Promise<ApiResult<SessionUser | null>> {
    const result = await apiRequest<{ user: SessionUser } | null>(`${AUTH}/get-session`)
    return result.ok ? { ok: true, data: result.data?.user ?? null } : result
}

export function signOut(): Promise<ApiResult<unknown>> {
    return apiRequest(`${AUTH}/sign-out`, { method: 'POST', body: {} })
}
