import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useNavMenu, OVERLAY_NAV_ID, OVERLAY_TOGGLE_ID } from '@components/app/NavMenuProvider'
import { UnitsToggle } from '@components/layout/UnitsToggle'
import { Wordmark } from '@components/layout/Wordmark'
import { Container, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button, ButtonLink, IconLink, NavLink } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { NAV_ROUTES } from '@core/config/routes'
import { SITE } from '@core/config/site'

export function Header() {
    const { open, openMenu, closeMenu } = useNavMenu()
    const location = useLocation()
    const [drawerPath, setDrawerPath] = useState(location.pathname)

    if (drawerPath !== location.pathname) {
        setDrawerPath(location.pathname)
        closeMenu()
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
                        {NAV_ROUTES.map((item) => (
                            <NavLink key={item.path} to={item.path}>
                                {item.label}
                            </NavLink>
                        ))}
                    </Row>

                    <Row gap={2} wrap={false} className='header_actions'>
                        {/*<Row className='header_units' gap={0} wrap={false}>*/}
                        {/*    <UnitsToggle />*/}
                        {/*</Row>*/}
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
                            id={OVERLAY_TOGGLE_ID}
                            label={open ? 'Close menu' : 'Open menu'}
                            ariaControls={OVERLAY_NAV_ID}
                            ariaExpanded={open}
                            onClick={() => {
                                if (open) closeMenu()
                                else openMenu()
                            }}
                        >
                            <Icon name={open ? 'close' : 'menu'} size={20} />
                        </Button>
                    </Row>
                </Row>
            </Container>

            {open ? (
                <Container>
                    <Stack
                        gap={0}
                        className='header_drawer'
                        as='nav'
                        ariaLabel='Primary, mobile'
                        id={OVERLAY_NAV_ID}
                    >
                        {NAV_ROUTES.map((item) => (
                            <Row
                                key={item.path}
                                className='header_drawer_row'
                                justify='between'
                                wrap={false}
                            >
                                <NavLink to={item.path}>{item.label}</NavLink>
                                <Icon name='arrow-right' size={14} />
                            </Row>
                        ))}
                        <Row
                            className='header_drawer_row'
                            justify='between'
                            wrap={false}
                            align='center'
                        >
                            <Text as='span' size='xs' tone='faint' mono uppercase>
                                Units
                            </Text>
                            <UnitsToggle />
                        </Row>
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
