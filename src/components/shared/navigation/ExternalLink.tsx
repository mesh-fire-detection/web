import type { ReactNode } from 'react'

export type ExternalHref = `https://${string}` | `mailto:${string}` | `/${string}`

type ExternalLinkProperties = {
    readonly href: ExternalHref
    readonly children: ReactNode
    readonly className?: string | undefined
    readonly download?: boolean | undefined
    readonly accessibleLabel?: string | undefined
}

const isOffSite = (href: ExternalHref): boolean =>
    href.startsWith('https://') || href.startsWith('mailto:')

/**
 * The only anchor on the site. Client navigation goes through NavHit; a real
 * `<a>` is reserved for another origin, mailto, or a same-origin file download.
 */
export const ExternalLink = ({
    href,
    children,
    className,
    download = false,
    accessibleLabel,
}: ExternalLinkProperties) => {
    const offSite = isOffSite(href)

    return (
        <a
            aria-label={accessibleLabel}
            className={className}
            href={href}
            rel={offSite ? 'noopener noreferrer' : undefined}
            target={offSite ? '_blank' : undefined}
            download={download ? '' : undefined}
        >
            {children}
        </a>
    )
}
