import { SITE } from '@core/config/site'

const configured = import.meta.env['VITE_API_URL'] as string | undefined

/**
 * Where the backend lives. Development talks to a local backend on its default
 * port; a production build talks to the live API. VITE_API_URL overrides both,
 * for pointing a local site at a staging or production backend.
 */
const API_URL = (configured ?? (import.meta.env.PROD ? SITE.api : 'http://localhost:3000')).replace(
    /\/+$/u,
    ''
)

/**
 * Every outcome a caller has to handle. Failures carry the API's error code
 * when there is one (`INVALID_OTP`, `bad_request`, …) so pages can choose their
 * own wording; `rate_limited` and `unreachable` are ours, because they are not
 * the API's opinion of the request but a reason it was never answered.
 */
export type ApiResult<T> =
    | { readonly ok: true; readonly data: T }
    | { readonly ok: false; readonly error: 'rate_limited' | 'unreachable' | (string & {}) }

const codeOf = (value: unknown): string | undefined =>
    typeof value === 'object' && value !== null && 'code' in value && typeof value.code === 'string'
        ? value.code
        : undefined

/**
 * Better Auth answers `{ code, message }`; the rest of the API answers
 * `{ error: { code, message } }`. Both reach the page as a code.
 */
const errorCode = (body: unknown): string => {
    const nested =
        typeof body === 'object' && body !== null && 'error' in body
            ? codeOf(body.error)
            : undefined
    return nested ?? codeOf(body) ?? 'unknown'
}

/**
 * A JSON request carrying the session cookie. The API sits on a sibling
 * subdomain, so the cookie is same-site but the request is cross-origin:
 * without `credentials: 'include'` the browser leaves the cookie behind.
 */
export async function apiRequest<T>(
    path: `/${string}`,
    init: { readonly method?: 'GET' | 'POST' | 'PATCH'; readonly body?: unknown } = {}
): Promise<ApiResult<T>> {
    let response: Response
    try {
        response = await fetch(`${API_URL}${path}`, {
            method: init.method ?? 'GET',
            credentials: 'include',
            headers: init.body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: init.body === undefined ? null : JSON.stringify(init.body),
        })
    } catch {
        return { ok: false, error: 'unreachable' }
    }

    if (response.status === 429) return { ok: false, error: 'rate_limited' }
    if (response.status >= 500) return { ok: false, error: 'unreachable' }

    let body: unknown = null
    try {
        body = await response.json()
    } catch {
        // An empty body is a valid answer to some calls; `null` stands in for it.
    }

    return response.ok ? { ok: true, data: body as T } : { ok: false, error: errorCode(body) }
}
