import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { PRIMARY_NAV, SITE } from '@/data/site'
import { Button, ButtonLink, Container, Icon, IconLink, NavLink, Row, Stack, Text } from '@/ui'

import { Wordmark } from './Wordmark'

export function Header() {
    const [open, setOpen] = useState(false)
    const location = useLocation()
    const [drawerPath, setDrawerPath] = useState(location.pathname)

    if (drawerPath !== location.pathname) {
        setDrawerPath(location.pathname)
        setOpen(false)
    }

    // Lock the page behind the open drawer.
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    return (
        <Stack as='header' gap={0} className='header'>
            <Container>
                <Row justify='between' wrap={false} gap={4} className='header_bar'>
                    <Wordmark />

                    <Row gap={6} wrap={false} className='header_nav' as='nav' ariaLabel='Primary'>
                        {PRIMARY_NAV.map((item) => (
                            <NavLink key={item.to} to={item.to}>
                                {item.label}
                            </NavLink>
                        ))}
                    </Row>

                    <Row gap={2} wrap={false} className='header_actions'>
                        <ButtonLink to='/build' size='sm' className='header_cta'>
                            Build a Node
                        </ButtonLink>
                        <IconLink href={SITE.github} label='Source on GitHub'>
                            <Icon name='github' size={18} />
                        </IconLink>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='header_toggle'
                            label={open ? 'Close menu' : 'Open menu'}
                            onClick={() => {
                                setOpen((value) => !value)
                            }}
                        >
                            <Icon name={open ? 'close' : 'menu'} size={20} />
                        </Button>
                    </Row>
                </Row>
            </Container>

            {open ? (
                <Container>
                    <Stack gap={0} className='header_drawer' as='nav' ariaLabel='Primary, mobile'>
                        {PRIMARY_NAV.map((item) => (
                            <Row
                                key={item.to}
                                className='header_drawer_row'
                                justify='between'
                                wrap={false}
                            >
                                <NavLink to={item.to}>{item.label}</NavLink>
                                <Icon name='arrow-right' size={14} />
                            </Row>
                        ))}
                        <Row className='header_drawer_row' wrap={false}>
                            <ButtonLink to='/build' size='md' full>
                                Build a Node
                            </ButtonLink>
                        </Row>
                        <Row className='header_drawer_row' wrap={false}>
                            <Text as='span' size='xs' tone='faint' mono uppercase>
                                {SITE.disclaimer}
                            </Text>
                        </Row>
                    </Stack>
                </Container>
            ) : null}
        </Stack>
    )
}
