export type ToneMark = 'good' | 'fair' | 'bad'

export type ToneSegment = {
    readonly text: string
    readonly tone: ToneMark | null
    /** Offset in the source string; unique per segment, so usable as a key. */
    readonly start: number
}

const MARK = /\{(good|fair|bad)\|([^{}]+)\}/g

/** Splits `{good|…}`, `{fair|…}` and `{bad|…}` marks out of copy into toned segments. */
export function toneSegments(text: string): readonly ToneSegment[] {
    const segments: ToneSegment[] = []
    let last = 0
    for (const match of text.matchAll(MARK)) {
        const [whole, tone, inner] = match
        if (match.index > last)
            segments.push({ text: text.slice(last, match.index), tone: null, start: last })
        segments.push({ text: inner ?? '', tone: tone as ToneMark, start: match.index })
        last = match.index + whole.length
    }
    if (last < text.length) segments.push({ text: text.slice(last), tone: null, start: last })
    return segments
}
