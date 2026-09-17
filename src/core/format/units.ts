import { decimal } from '@core/format/format'

export type UnitSystem = 'imperial' | 'metric'

export const UNITS_STORAGE_KEY = 'mfd-units'
export const DEFAULT_UNIT_SYSTEM: UnitSystem = 'imperial'

const KM_PER_MILE = 1.609344
const M_PER_FOOT = 0.3048
const LB_PER_KG = 2.2046226218

export function parseUnitSystem(value: string | null | undefined): UnitSystem {
    return value === 'metric' ? 'metric' : DEFAULT_UNIT_SYSTEM
}

export function toMiles(km: number): number {
    return km / KM_PER_MILE
}

export function toKm(miles: number): number {
    return miles * KM_PER_MILE
}

export function toFeet(meters: number): number {
    return meters / M_PER_FOOT
}

export function toMeters(feet: number): number {
    return feet * M_PER_FOOT
}

export function formatDistance(km: number, system: UnitSystem, places = 1): string {
    return system === 'imperial'
        ? `${decimal(toMiles(km), places)} mi`
        : `${decimal(km, places)} km`
}

export function formatLength(
    meters: number,
    system: UnitSystem,
    options: { readonly places?: number; readonly agl?: boolean } = {}
): string {
    const places = options.places ?? 0
    const body =
        system === 'imperial'
            ? `${decimal(toFeet(meters), places)} ft`
            : `${decimal(meters, places)} m`
    return options.agl ? `${body} AGL` : body
}

export function formatWeight(kg: number, system: UnitSystem, places = 1): string {
    if (system === 'imperial') return `${decimal(kg * LB_PER_KG, places)} lb`
    return kg < 1 ? `${decimal(kg * 1000, 0)} g` : `${decimal(kg, places)} kg`
}

/** Canonical SI values in copy. Render with `formatCopy`. */
type CopyMeasure =
    | { readonly m: number; readonly places?: number }
    | { readonly km: number; readonly places?: number }
    | { readonly kg: number; readonly places?: number }

export type MeasuredCopy = string | readonly (string | CopyMeasure)[]

function formatMeasure(part: CopyMeasure, system: UnitSystem): string {
    if ('km' in part) return formatDistance(part.km, system, part.places ?? 1)
    return 'kg' in part
        ? formatWeight(part.kg, system, part.places ?? 1)
        : formatLength(part.m, system, { places: part.places ?? 0 })
}

export function formatCopy(copy: MeasuredCopy, system: UnitSystem): string {
    return typeof copy === 'string'
        ? copy
        : copy
              .map((part) => (typeof part === 'string' ? part : formatMeasure(part, system)))
              .join('')
}
