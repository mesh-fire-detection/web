import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Text } from '../core/Text'

export function List({
  children,
  marker = 'dash',
  gap = 2,
  ordered = false,
}: {
  children: ReactNode
  marker?: 'dash' | 'dot' | 'none' | 'number' | undefined
  gap?: 1 | 2 | 3 | 4 | undefined
  ordered?: boolean | undefined
}) {
  const Component = ordered ? 'ol' : 'ul'
  return <Component className={cx('list', `list--${marker}`, `gap--${gap}`)}>{children}</Component>
}

export function ListItem({
  children,
  tone = 'muted',
  size = 'md',
}: {
  children: ReactNode
  tone?: 'default' | 'muted' | 'faint' | undefined
  size?: 'sm' | 'md' | undefined
}) {
  return (
    <Text as="li" tone={tone} size={size} className="list__item">
      {children}
    </Text>
  )
}

/** Definition-style list for spec sheets. */
export function DescriptionList({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
  return <dl className={cx('dlist', `dlist--${columns}`)}>{children}</dl>
}

export function DescriptionItem({ term, children }: { term: ReactNode; children: ReactNode }) {
  return (
    <div className="dlist__row">
      <Text as="dt" size="xs" tone="faint" mono uppercase weight={600}>
        {term}
      </Text>
      <Text as="dd" size="sm" tone="default" className="dlist__dd">
        {children}
      </Text>
    </div>
  )
}
