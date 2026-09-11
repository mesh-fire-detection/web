import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { Container, Stack } from '@components/shared/primitives/Layout'
import { Eyebrow, Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'

/** Sets the document title and scrolls a fresh route to the top. */
function useRouteChrome(title: string) {
    const { pathname, hash } = useLocation()

    useEffect(() => {
        document.title = `${title} — Mesh Fire Detection`
    }, [title])

    useEffect(() => {
        if (hash) {
            document
                .querySelector(`#${hash.slice(1)}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
        }
        window.scrollTo({ top: 0 })
    }, [pathname, hash])
}

export function Page({
    title,
    eyebrow,
    lede,
    aside,
    children,
    headed = true,
}: {
    title: string
    eyebrow?: string | undefined
    lede?: string | undefined
    aside?: ReactNode | undefined
    children: ReactNode
    headed?: boolean | undefined
}) {
    useRouteChrome(title)

    return (
        <Stack as='main' id='main' tabIndex={-1} gap={0} className='page'>
            {headed ? (
                <Container as='header' className='page_head'>
                    <Stack gap={4}>
                        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                        <Heading level={1} size='3xl' measure={22}>
                            {title}
                        </Heading>
                        {lede ? (
                            <Text size='lg' tone='muted' measure={78}>
                                {lede}
                            </Text>
                        ) : null}
                        {aside}
                    </Stack>
                </Container>
            ) : null}
            {children}
        </Stack>
    )
}
