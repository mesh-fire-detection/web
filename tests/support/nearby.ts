import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { Mesh, Portnums, Telemetry } from '@meshtastic/protobufs'
import { vi } from 'vitest'

import type { RadioConnection } from '@core/nearby/transport/bluetooth'

export function radioMessage(payloadVariant: Mesh.FromRadio['payloadVariant']): Uint8Array {
    return toBinary(Mesh.FromRadioSchema, create(Mesh.FromRadioSchema, { payloadVariant }))
}

export function telemetryPacket(
    sender: number,
    variant: Telemetry.Telemetry['variant'],
    time = 0
): Uint8Array {
    const payload = toBinary(
        Telemetry.TelemetrySchema,
        create(Telemetry.TelemetrySchema, { time, variant })
    )
    const data = create(Mesh.DataSchema, { portnum: Portnums.PortNum.TELEMETRY_APP, payload })
    return radioMessage({
        case: 'packet',
        value: create(Mesh.MeshPacketSchema, {
            from: sender,
            payloadVariant: {
                case: 'decoded',
                value: data,
            },
        }),
    })
}

/** A text packet carrying only the radio-link metadata the receiver attaches. */
export function linkPacket(
    sender: number,
    link: {
        readonly snr: number
        readonly rssi: number
        readonly hops: number
        readonly viaMqtt?: boolean
    }
): Uint8Array {
    return radioMessage({
        case: 'packet',
        value: create(Mesh.MeshPacketSchema, {
            from: sender,
            rxSnr: link.snr,
            rxRssi: link.rssi,
            hopStart: 3,
            hopLimit: 3 - link.hops,
            viaMqtt: link.viaMqtt ?? false,
            payloadVariant: {
                case: 'decoded',
                value: create(Mesh.DataSchema, { portnum: Portnums.PortNum.TEXT_MESSAGE_APP }),
            },
        }),
    })
}

export function mockRadio(num: number) {
    const receivers: ((bytes: Uint8Array) => void)[] = []
    let lost: () => void = () => {}
    const connection: RadioConnection = {
        id: `bluetooth-${String(num)}`,
        name: `Meshtastic_${String(num)}`,
        transport: 'bluetooth',
        connect: vi.fn<RadioConnection['connect']>((request, receive, disconnected) => {
            receivers.push(receive)
            lost = disconnected
            const payload = fromBinary(Mesh.ToRadioSchema, request).payloadVariant
            if (payload.case !== 'wantConfigId') throw new Error('Expected configuration request')
            receive(
                radioMessage({
                    case: 'myInfo',
                    value: create(Mesh.MyNodeInfoSchema, { myNodeNum: num }),
                })
            )
            receive(radioMessage({ case: 'configCompleteId', value: payload.value }))
            return Promise.resolve()
        }),
        disconnect: vi.fn(),
    }
    return {
        connection,
        receivers,
        send: (bytes: Uint8Array) => {
            receivers.at(-1)?.(bytes)
        },
        loseConnection: () => {
            lost()
        },
    }
}
