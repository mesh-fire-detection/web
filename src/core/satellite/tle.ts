export type SatelliteTle = {
    readonly norad: number
    readonly name: string
    readonly line1: string
    readonly line2: string
    /** TLE epoch as Unix seconds, matching the firmware command protocol. */
    readonly epoch: number
    readonly ageDays: number
}

export function validTleLine(line: string, lineNumber: 1 | 2): boolean {
    if (
        line.length !== 69 ||
        !line.startsWith(String(lineNumber)) ||
        line[1] !== ' ' ||
        !/^\d{5}$/u.test(line.slice(2, 7)) ||
        !/^\d$/u.test(line[68] ?? '')
    )
        return false
    let checksum = 0
    for (let index = 0; index < 68; index++) {
        const character = line.codePointAt(index) ?? 0
        if (character >= 48 && character <= 57) checksum += character - 48
        else if (character === 45) checksum++
    }
    return checksum % 10 === Number(line[68])
}

function epochUnixSeconds(line1: string): number | null {
    if (!/^\d{2}\d{3}\.\d{8}$/u.test(line1.slice(18, 32))) return null
    const yearField = Number(line1.slice(18, 20))
    const year = (yearField < 57 ? 2000 : 1900) + yearField
    const day = Number(line1.slice(20, 32))
    const leapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    const daysInYear = 365 + Number(leapYear)
    const epoch = Math.floor(Date.UTC(year, 0, 1) / 1000 + (day - 1) * 86_400 + 0.5)
    return day >= 1 && day <= daysInYear ? epoch : null
}

export function parseTleCatalog(text: string, now = Date.now()): readonly SatelliteTle[] {
    const lines = text
        .replaceAll('\r', '')
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0)
    const tles: SatelliteTle[] = []
    let index = 0
    while (index < lines.length) {
        let name = ''
        let line1: string | undefined
        let line2: string | undefined
        const currentLine = lines[index] ?? ''
        if (currentLine.startsWith('1 ')) {
            line1 = currentLine
            line2 = lines[index + 1]
            name = `NORAD ${currentLine.slice(2, 7).trim()}`
            index += 2
        } else {
            name = (lines[index] ?? '').replace(/^0\s+/u, '').trim()
            line1 = lines[index + 1]
            line2 = lines[index + 2]
            index += 3
        }
        if (!line1 || !line2 || !validTleLine(line1, 1) || !validTleLine(line2, 2)) continue
        const noradText = line1.slice(2, 7)
        if (line2.slice(2, 7) !== noradText) continue
        const epoch = epochUnixSeconds(line1)
        if (epoch === null) continue
        const norad = Number(noradText)
        tles.push({
            norad,
            name,
            line1,
            line2,
            epoch,
            ageDays: Math.floor((Math.floor(now / 1000) - epoch) / 86_400),
        })
    }
    return tles
}

export function newestTles(tles: readonly SatelliteTle[]): readonly SatelliteTle[] {
    const newest = new Map<number, SatelliteTle>()
    for (const tle of tles) {
        const current = newest.get(tle.norad)
        if (!current || tle.epoch > current.epoch) newest.set(tle.norad, tle)
    }
    const values: SatelliteTle[] = []
    for (const tle of newest.values()) values.push(tle)
    return values.toSorted((left, right) => left.norad - right.norad)
}

export function mergeTles(
    current: readonly SatelliteTle[],
    incoming: readonly SatelliteTle[]
): readonly SatelliteTle[] {
    return newestTles([...current, ...incoming])
}
