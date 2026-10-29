import { apiRequest, type ApiResult } from '@core/api/client'

type NodeType = 'base' | 'cellular' | 'sensor' | 'vision'

/** A node as this browser saw it. Only the number is certain; the rest is what it reported. */
export type NodeReport = {
    readonly nodeNum: number
    readonly name: string | null
    readonly hardware: string | null
    readonly firmware: string | null
    /** Meshtastic's `MyNodeInfo.device_id` as hex; keeps the node's ID if its number changes. */
    readonly hardwareId: string | null
    /** From the name our firmware gives a node, when it has one. */
    readonly type: NodeType | null
}

/** A registered node the member is on, as much of it as `/account` shows. */
export type MyNode = {
    /** Assigned by the server when the node was registered, and never changed. */
    readonly id: string
    readonly meshId: string
    readonly name: string
    readonly type: NodeType | null
    readonly details: { readonly hardware: string | null } | null
}

export type SubscriptionStatus = 'none' | 'unconfirmed' | 'confirmed' | 'unsubscribed'

/** Footer sign-up. The API answers every address alike and sends only a confirmation link. */
export function subscribe(email: string): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/subscribe', { method: 'POST', body: { email } })
}

export function confirmSubscription(token: string): Promise<ApiResult<unknown>> {
    return apiRequest('/v1/subscribe/confirm', { method: 'POST', body: { token } })
}

export async function fetchMySubscription(): Promise<ApiResult<SubscriptionStatus>> {
    const result = await apiRequest<{ subscription: { status: SubscriptionStatus } }>(
        '/v1/me/subscription'
    )
    return result.ok ? { ok: true, data: result.data.subscription.status } : result
}

export async function setMySubscription(
    subscribed: boolean
): Promise<ApiResult<SubscriptionStatus>> {
    const result = await apiRequest<{ subscription: { status: SubscriptionStatus } }>(
        '/v1/me/subscription',
        { method: 'PATCH', body: { subscribed } }
    )
    return result.ok ? { ok: true, data: result.data.subscription.status } : result
}

export async function fetchMyNodes(): Promise<ApiResult<readonly MyNode[]>> {
    const result = await apiRequest<{ nodes: MyNode[] }>('/v1/me/nodes')
    return result.ok ? { ok: true, data: result.data.nodes } : result
}

/**
 * Adds nodes this browser connected to the signed-in member: a new node is
 * registered, a known one gains them. Repeats are harmless.
 */
export async function addMyNodes(
    nodes: readonly NodeReport[]
): Promise<ApiResult<readonly MyNode[]>> {
    const result = await apiRequest<{ nodes: MyNode[] }>('/v1/me/nodes', {
        method: 'POST',
        body: { nodes },
    })
    return result.ok ? { ok: true, data: result.data.nodes } : result
}
