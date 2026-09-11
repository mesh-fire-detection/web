export type ClassValue =
    string | number | false | null | undefined | Record<string, boolean | null | undefined>

/** Tiny classname joiner. Keeps primitive components readable. */
export function cx(...values: ClassValue[]): string {
    const out: string[] = []
    for (const value of values) {
        if (!value) continue
        if (typeof value === 'string' || typeof value === 'number') {
            out.push(String(value))
            continue
        }
        for (const [key, on] of Object.entries(value)) if (on) out.push(key)
    }
    return out.join(' ')
}
