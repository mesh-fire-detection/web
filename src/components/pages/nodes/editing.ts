import type { Node, NodeChanges, NodeType } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'

const invalid = nodeContent.edit.invalid

/** The edit form as typed: every field a string until it is saved. */
export type Draft = {
    readonly name: string
    readonly type: NodeType | 'none'
    readonly latitude: string
    readonly longitude: string
    readonly elevationM: string
    readonly antennaHeightM: string
    readonly deployedOn: string
    readonly note: string
    readonly exactPosition: boolean
}

export type DraftErrors = Partial<Record<keyof Draft, string>>

const typed = (value: number | null | undefined): string =>
    value === null || value === undefined ? '' : String(value)

/** Starts from the exact values: only the people on a node, who see them, get the form. */
export function draftOf(node: Node): Draft {
    const exact = node.details?.position ?? null
    return {
        name: node.name,
        type: node.type ?? 'none',
        longitude: typed(exact?.[0]),
        latitude: typed(exact?.[1]),
        elevationM: typed(node.details?.elevationM),
        antennaHeightM: typed(node.antennaHeightM),
        deployedOn: node.deployedOn ?? '',
        note: node.details?.note ?? '',
        exactPosition: node.details?.exactPosition ?? false,
    }
}

const orNull = (raw: string): string | null => (raw.trim() === '' ? null : raw.trim())

/** Empty is null; anything else must be a finite number, or it is undefined. */
function numberOrNull(raw: string): number | null | undefined {
    const text = orNull(raw)
    if (text === null) return null
    const value = Number(text)
    return Number.isFinite(value) ? value : undefined
}

const within = (value: number | null | undefined, limit: number): boolean =>
    value === null || (value !== undefined && Math.abs(value) <= limit)

/** Checks what the server would refuse outright, so the person hears about it on the field. */
export function parseDraft(
    draft: Draft
):
    | { readonly ok: true; readonly changes: NodeChanges }
    | { readonly ok: false; readonly errors: DraftErrors } {
    const latitude = numberOrNull(draft.latitude)
    const longitude = numberOrNull(draft.longitude)
    const elevationM = numberOrNull(draft.elevationM)
    const antennaHeightM = numberOrNull(draft.antennaHeightM)
    const deployedOn = orNull(draft.deployedOn)

    const errors: DraftErrors = {
        ...(draft.name.trim() === '' && { name: invalid.name }),
        ...(!within(latitude, 90) && { latitude: invalid.latitude }),
        ...(!within(longitude, 180) && { longitude: invalid.longitude }),
        ...((latitude === null) !== (longitude === null) &&
            within(latitude, 90) &&
            within(longitude, 180) && { latitude: invalid.pair }),
        ...(elevationM === undefined && { elevationM: invalid.number }),
        ...(antennaHeightM === undefined && { antennaHeightM: invalid.number }),
        ...(deployedOn !== null &&
            !/^\d{4}-\d{2}-\d{2}$/u.test(deployedOn) && {
                deployedOn: invalid.date,
            }),
    }
    return Object.keys(errors).length > 0
        ? { ok: false, errors }
        : {
              ok: true,
              changes: {
                  name: draft.name.trim(),
                  type: draft.type === 'none' ? null : draft.type,
                  position:
                      latitude === null ||
                      latitude === undefined ||
                      longitude === null ||
                      longitude === undefined
                          ? null
                          : [longitude, latitude],
                  elevationM: elevationM ?? null,
                  antennaHeightM: antennaHeightM ?? null,
                  deployedOn,
                  note: orNull(draft.note),
                  exactPosition: draft.exactPosition,
              },
          }
}
