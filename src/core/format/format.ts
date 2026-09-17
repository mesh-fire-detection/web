const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
})

const usdCents = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
})

export function money(value: number, cents = false): string {
    return cents ? usdCents.format(value) : usd.format(value)
}

export function decimal(value: number, places = 1): string {
    return value.toFixed(places)
}

export function signed(value: number, places = 1): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(places)}`
}

/** "4 min ago", "2 d ago", "never". */
export function sinceMinutes(minutes: number | null): string {
    if (minutes === null) return 'never'
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${Math.round(minutes)} min ago`
    const hours = minutes / 60
    return hours < 48 ? `${Math.round(hours)} h ago` : `${Math.round(hours / 24)} d ago`
}

export function coordinate([longitude, latitude]: [number, number]): string {
    const ns = latitude >= 0 ? 'N' : 'S'
    const ew = longitude >= 0 ? 'E' : 'W'
    return `${Math.abs(latitude).toFixed(4)}° ${ns}, ${Math.abs(longitude).toFixed(4)}° ${ew}`
}

export function plural(count: number, one: string, many = `${one}s`): string {
    return count === 1 ? one : many
}
