import type { CSSProperties, ReactNode, Ref } from 'react'
import { cx } from '@/lib/cx'

export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

interface FlexProps {
  children: ReactNode
  gap?: Space | undefined
  align?: Align | undefined
  justify?: Justify | undefined
  wrap?: boolean | undefined
  /** Let the box shrink below its content size inside a flex parent. */
  minWidth0?: boolean | undefined
  grow?: boolean | undefined
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'aside' | 'main' | 'ul' | 'li' | 'form' | undefined
  className?: string | undefined
  style?: CSSProperties | undefined
  id?: string | undefined
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
  role,
  ariaLabel,
}: FlexProps) {
  return (
    <Component
      id={id}
      style={style}
      role={role}
      aria-label={ariaLabel}
      className={cx(
        'flex',
        'flex--col',
        `gap--${gap}`,
        `ai--${align}`,
        `jc--${justify}`,
        grow && 'grow',
        minWidth0 && 'minw0',
        className,
      )}
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
      id={id}
      style={style}
      role={role}
      aria-label={ariaLabel}
      className={cx(
        'flex',
        'flex--row',
        `gap--${gap}`,
        `ai--${align}`,
        `jc--${justify}`,
        wrap && 'flex--wrap',
        grow && 'grow',
        minWidth0 && 'minw0',
        className,
      )}
    >
      {children}
    </Component>
  )
}

export interface GridProps {
  children: ReactNode
  /** Columns at the widest breakpoint. Collapses automatically below. */
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined
  /** Auto-fit tracks of at least this width instead of a fixed count. */
  minColumnWidth?: number | undefined
  gap?: Space | undefined
  align?: Align | undefined
  as?: 'div' | 'section' | 'ul' | undefined
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
    minColumnWidth !== undefined
      ? { gridTemplateColumns: `repeat(auto-fit, minmax(min(${minColumnWidth}px, 100%), 1fr))` }
      : undefined

  return (
    <Component
      id={id}
      style={style}
      className={cx(
        'grid',
        minColumnWidth === undefined && `grid--${columns}`,
        `gap--${gap}`,
        `ai--${align}`,
        className,
      )}
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
  return <Component className={cx('container', `container--${width}`, className)}>{children}</Component>
}

/** A vertical band of the page. Owns all top/bottom rhythm. */
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
      id={id}
      aria-labelledby={labelledBy}
      className={cx('section', `section--${space}`, `section--${tone}`, bordered && 'section--bordered', grid && 'bg-grid')}
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
  tone?: 'surface' | 'surface-2' | 'surface-3' | 'transparent' | 'fire' | 'live' | 'warn' | 'dead' | undefined
  radius?: 'sm' | 'md' | 'lg' | 'none' | undefined
  border?: boolean | undefined
  /** Coloured rule down the left edge. */
  accent?: 'fire' | 'live' | 'warn' | 'dead' | undefined
  grow?: boolean | undefined
  className?: string | undefined
  as?: 'div' | 'article' | 'li' | 'aside' | 'form' | undefined
  id?: string | undefined
}) {
  return (
    <Component
      id={id}
      className={cx(
        'box',
        `box--${tone}`,
        `p--${padding}`,
        `r--${radius}`,
        border && 'box--border',
        accent && `box--accent box--accent-${accent}`,
        grow && 'grow',
        className,
      )}
    >
      {children}
    </Component>
  )
}

export function Divider({ space = 5 }: { space?: Space }) {
  return <hr className={cx('divider', `divider--${space}`)} />
}

export function Spacer({ size = 4 }: { size?: Space }) {
  return <div aria-hidden className={cx('spacer', `spacer--${size}`)} />
}

/** Horizontally scrollable wrapper so wide tables never break the page. */
export function ScrollArea({ children, label }: { children: ReactNode; label?: string | undefined }) {
  return (
    <div className="scroll-area" tabIndex={0} role="region" aria-label={label}>
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
  return <div ref={ref} className={className} style={style} role={role} aria-label={ariaLabel} />
}
