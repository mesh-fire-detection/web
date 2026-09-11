import type { CSSProperties, ReactNode, Ref } from 'react'

import { cx } from '@/lib/cx'

export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around'
type HostElement = 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main' | 'article'

type FlexProps = {
    children: ReactNode
    gap?: Space | undefined
    align?: Align | undefined
    justify?: Justify | undefined
    wrap?: boolean | undefined
    minWidth0?: boolean | undefined
    grow?: boolean | undefined
    as?: HostElement | undefined
    className?: string | undefined
    style?: CSSProperties | undefined
    id?: string | undefined
    tabIndex?: number | undefined
    role?: 'group' | 'list' | 'toolbar' | 'tablist' | 'presentation' | undefined
    ariaLabel?: string | undefined
}

/** Vertical flow. The default container for anything stacked. */
export function Stack({
    children,
    gap = 4,
    align = 'stretch',
    justify = 'start',
    grow = false,
    minWidth0 = false,
    as: Component = 'div',
    className,
    style,
    id,
    tabIndex,
    role,
    ariaLabel,
}: FlexProps) {
    return (
        <Component
            aria-label={ariaLabel}
            className={cx(
                'flex',
                'flex_col',
                `gap_${String(gap)}`,
                `ai_${align}`,
                `jc_${justify}`,
                grow && 'grow',
                minWidth0 && 'minw0',
                className
            )}
            id={id}
            role={role}
            style={style}
            tabIndex={tabIndex}
        >
            {children}
        </Component>
    )
}

/** Horizontal flow. Wraps by default so phones never overflow. */
export function Row({
    children,
    gap = 3,
    align = 'center',
    justify = 'start',
    wrap = true,
    grow = false,
    minWidth0 = false,
    as: Component = 'div',
    className,
    style,
    id,
    role,
    ariaLabel,
}: FlexProps) {
    return (
        <Component
            aria-label={ariaLabel}
            className={cx(
                'flex',
                'flex_row',
                `gap_${String(gap)}`,
                `ai_${align}`,
                `jc_${justify}`,
                wrap && 'flex_wrap',
                grow && 'grow',
                minWidth0 && 'minw0',
                className
            )}
            id={id}
            role={role}
            style={style}
        >
            {children}
        </Component>
    )
}

export type GridProps = {
    children: ReactNode
    columns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined
    minColumnWidth?: number | undefined
    gap?: Space | undefined
    align?: Align | undefined
    as?: 'div' | 'section' | undefined
    className?: string | undefined
    id?: string | undefined
}

export function Grid({
    children,
    columns = 3,
    minColumnWidth,
    gap = 4,
    align = 'stretch',
    as: Component = 'div',
    className,
    id,
}: GridProps) {
    const style: CSSProperties | undefined =
        minColumnWidth === undefined
            ? undefined
            : {
                  gridTemplateColumns: `repeat(auto-fit, minmax(min(${String(minColumnWidth)}px, 100%), 1fr))`,
              }

    return (
        <Component
            className={cx(
                'grid',
                minColumnWidth === undefined && `grid_${String(columns)}`,
                `gap_${String(gap)}`,
                `ai_${align}`,
                className
            )}
            id={id}
            style={style}
        >
            {children}
        </Component>
    )
}

/** Centred page-width column. */
export function Container({
    children,
    width = 'default',
    className,
    as = 'div',
}: {
    children: ReactNode
    width?: 'default' | 'narrow' | 'wide' | undefined
    className?: string | undefined
    as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main' | undefined
}) {
    const Component = as
    return (
        <Component
            className={cx('container', width !== 'default' && `container_${width}`, className)}
        >
            {children}
        </Component>
    )
}

/** A vertical band of the page. Owns all top and bottom rhythm. */
export function Section({
    children,
    space = 'md',
    tone = 'default',
    grid = false,
    bordered = false,
    width = 'default',
    id,
    labelledBy,
}: {
    children: ReactNode
    space?: 'none' | 'sm' | 'md' | 'lg' | undefined
    tone?: 'default' | 'raised' | 'sunken' | undefined
    grid?: boolean | undefined
    bordered?: boolean | undefined
    width?: 'default' | 'narrow' | 'wide' | undefined
    id?: string | undefined
    labelledBy?: string | undefined
}) {
    return (
        <section
            aria-labelledby={labelledBy}
            className={cx(
                'section',
                `section_${space}`,
                tone !== 'default' && `section_${tone}`,
                bordered && 'section_bordered',
                grid && 'bg_grid'
            )}
            id={id}
        >
            <Container width={width}>{children}</Container>
        </section>
    )
}

/** Generic surface with padding and a border. Cards, panels, callouts. */
export function Box({
    children,
    padding = 5,
    tone = 'surface',
    radius = 'md',
    border = true,
    accent,
    grow = false,
    className,
    as: Component = 'div',
    id,
}: {
    children: ReactNode
    padding?: Space | undefined
    tone?:
        | 'surface'
        | 'surface-2'
        | 'surface-3'
        | 'transparent'
        | 'fire'
        | 'live'
        | 'warn'
        | 'dead'
        | undefined
    radius?: 'sm' | 'md' | 'lg' | 'none' | undefined
    border?: boolean | undefined
    accent?: 'fire' | 'live' | 'warn' | 'dead' | undefined
    grow?: boolean | undefined
    className?: string | undefined
    as?: 'div' | 'article' | undefined
    id?: string | undefined
}) {
    const toneClass = `box_${tone.replaceAll('-', '_')}`

    return (
        <Component
            className={cx(
                'box',
                toneClass,
                `p_${String(padding)}`,
                `r_${radius}`,
                border && 'box_border',
                accent && `box_accent box_accent_${accent}`,
                grow && 'grow',
                className
            )}
            id={id}
        >
            {children}
        </Component>
    )
}

export function Divider({ space = 5 }: { space?: Space }) {
    return <div className={cx('divider', `divider_${String(space)}`)} />
}

export function Spacer({ size = 4 }: { size?: Space }) {
    return <div aria-hidden className={`spacer_${String(size)}`} />
}

/** Horizontally scrollable wrapper so wide tables never break the page. */
export function ScrollArea({
    children,
    label,
}: {
    children: ReactNode
    label?: string | undefined
}) {
    return (
        <div aria-label={label} className='scroll_area' role='region' tabIndex={0}>
            {children}
        </div>
    )
}

/**
 * A bare div that forwards a ref. The one place a third-party library needs a
 * real DOM node to mount into — currently maplibre.
 */
export function Canvas({
    ref,
    className,
    style,
    ariaLabel,
    role,
}: {
    ref?: Ref<HTMLDivElement> | undefined
    className?: string | undefined
    style?: CSSProperties | undefined
    ariaLabel?: string | undefined
    role?: 'img' | 'application' | undefined
}) {
    return <div ref={ref} aria-label={ariaLabel} className={className} role={role} style={style} />
}
