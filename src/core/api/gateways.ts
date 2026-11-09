import { apiRequest, type ApiResult } from '@core/api/client'

/** Delivered by MQTT (the gateway's own internet) or by its Notecard through Notehub. */
type GatewayPath = 'mqtt' | 'notecard'

/** One gateway as anyone signed in sees it: no credentials and no identities. */
export type GatewayStatus = {
    readonly nodeId: string
    readonly name: string
    readonly enabled: boolean
    readonly connections: readonly {
        readonly via: GatewayPath
        readonly lastDeliveryAt: string | null
    }[]
    readonly lastDeliveryAt: string | null
    /** Deliveries the backend refused in the last 24 hours. */
    readonly rejectedLast24h: number
}

export type GatewaysStatus = {
    /** The backend's own connection to the MQTT broker. */
    readonly broker: 'connected' | 'disconnected' | 'disabled'
    readonly gateways: readonly GatewayStatus[]
}

/** backend#37: members see enabled gateways, admins see all of them. */
export function fetchGatewaysStatus(): Promise<ApiResult<GatewaysStatus>> {
    return apiRequest<GatewaysStatus>('/v1/gateways/status')
}
