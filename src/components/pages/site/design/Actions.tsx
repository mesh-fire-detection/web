import { useState } from 'react'

import { NodeCounter } from '@components/layout/NodeCounter'
import { RadioChipView } from '@components/layout/RadioChip'
import { UnitsToggle } from '@components/layout/UnitsToggle'
import { Wordmark } from '@components/layout/Wordmark'
import { Group, Specimen } from '@components/pages/site/design/Specimen'
import { SegmentedControl } from '@components/shared/forms/ChoiceFields'
import { Box, Grid, Row, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import {
    BareButton,
    Button,
    ButtonAnchor,
    ButtonLink,
    IconButton,
    IconLink,
    LinkCard,
    NavLink,
    SkipLink,
    TextLink,
    type ButtonVariant,
} from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'

const VARIANTS: readonly ButtonVariant[] = [
    'primary',
    'secondary',
    'ghost',
    'danger',
    'bluetooth',
    'usb',
    'contrast',
]
const PERIODS = [
    { value: 'day', label: '24h' },
    { value: 'week', label: '7d' },
    { value: 'month', label: '30d' },
] as const

export function Actions() {
    const [pressed, setPressed] = useState(false)
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
    const [clicks, setClicks] = useState(0)
    const count = () => {
        setClicks((value) => value + 1)
    }
    return (
        <Specimen
            title='Actions and navigation'
            lede='Every variant in each state. Hover and focus states are live; Tab through to see focus.'
        >
            <Group label='Button variants × states'>
                <Stack gap={3}>
                    {VARIANTS.map((variant) => (
                        <Row key={variant} gap={3}>
                            <Button variant={variant} onClick={count}>
                                {variant}
                            </Button>
                            <Button variant={variant} disabled>
                                Disabled
                            </Button>
                            <Button variant={variant} loading>
                                Loading
                            </Button>
                            <Button variant={variant} iconBefore={<Icon name='check' size={16} />}>
                                Icon before
                            </Button>
                            <Button
                                variant={variant}
                                iconAfter={<Icon name='arrow-right' size={16} />}
                            >
                                Icon after
                            </Button>
                        </Row>
                    ))}
                </Stack>
            </Group>
            <Group label='Button sizes'>
                <Row gap={3} align='center'>
                    <Button size='sm'>Small</Button>
                    <Button size='md'>Medium</Button>
                    <Button size='lg'>Large</Button>
                </Row>
            </Group>
            <Group label='Toggle (pressed) and full width'>
                <Stack gap={3}>
                    <Row gap={3}>
                        <Button
                            variant='secondary'
                            pressed={pressed}
                            onClick={() => {
                                setPressed((value) => !value)
                            }}
                        >
                            {pressed ? 'Pressed' : 'Not pressed'}
                        </Button>
                        <Button variant='secondary' pressed>
                            Always pressed
                        </Button>
                    </Row>
                    <Button full>Full width</Button>
                </Stack>
            </Group>
            <Group label='Icon buttons'>
                <Row gap={3}>
                    {VARIANTS.map((variant) => (
                        <IconButton
                            key={variant}
                            label={`Close (${variant})`}
                            variant={variant}
                            onClick={count}
                        >
                            <Icon name='close' />
                        </IconButton>
                    ))}
                    <IconButton label='Close (disabled)' disabled onClick={count}>
                        <Icon name='close' />
                    </IconButton>
                </Row>
            </Group>
            <Group label='Bare button'>
                <Row gap={3}>
                    <BareButton onClick={count}>
                        <Text as='span'>Bare action, pressed {clicks} times</Text>
                    </BareButton>
                </Row>
            </Group>
            <Group label='Links styled as buttons'>
                <Row gap={3}>
                    <ButtonLink to='/'>Internal</ButtonLink>
                    <ButtonLink
                        to='/'
                        variant='secondary'
                        iconAfter={<Icon name='arrow-right' size={16} />}
                    >
                        Internal secondary
                    </ButtonLink>
                    <ButtonAnchor
                        href='https://example.com'
                        variant='ghost'
                        iconAfter={<Icon name='arrow-up-right' size={16} />}
                    >
                        External
                    </ButtonAnchor>
                    <ButtonAnchor
                        href='/favicon.svg'
                        download
                        variant='secondary'
                        iconBefore={<Icon name='download' size={16} />}
                    >
                        Download
                    </ButtonAnchor>
                </Row>
            </Group>
            <Group label='Text links: tones, sizes, mono'>
                <Stack gap={2}>
                    <Row gap={4}>
                        <TextLink to='/'>Link (default)</TextLink>
                        <TextLink to='/' tone='quiet'>
                            Quiet
                        </TextLink>
                        <TextLink to='/' tone='fire'>
                            Fire
                        </TextLink>
                        <TextLink to='/' mono>
                            Mono
                        </TextLink>
                    </Row>
                    <Row gap={4} align='baseline'>
                        <TextLink to='/' size='xs'>
                            Extra small
                        </TextLink>
                        <TextLink to='/' size='sm'>
                            Small
                        </TextLink>
                        <TextLink to='/' size='md'>
                            Medium
                        </TextLink>
                    </Row>
                </Stack>
            </Group>
            <Group label='Navigation links: active and inactive'>
                <Row gap={4}>
                    <NavLink to='/design'>Active (this page)</NavLink>
                    <NavLink to='/map'>Inactive</NavLink>
                </Row>
            </Group>
            <Group label='Icon link and link card'>
                <Row gap={4} align='center'>
                    <IconLink href='https://github.com' label='GitHub'>
                        <Icon name='github' />
                    </IconLink>
                    <IconLink href='https://discord.com' label='Discord'>
                        <Icon name='discord' />
                    </IconLink>
                    <LinkCard href='https://example.com'>
                        <Box lift>
                            <Text size='sm'>Link card around a lifting box</Text>
                        </Box>
                    </LinkCard>
                </Row>
            </Group>
            <Group label='Segmented control'>
                <SegmentedControl
                    ariaLabel='Period'
                    value={period}
                    options={PERIODS}
                    onChange={setPeriod}
                />
            </Group>
            <Group label='Skip link (shown in place; on the site it appears on first Tab)'>
                <div className='design_skip'>
                    <SkipLink to='#main'>Skip to content</SkipLink>
                </div>
            </Group>
        </Specimen>
    )
}

export function Chrome() {
    return (
        <Specimen
            title='Site chrome'
            lede='Pieces of the header and footer. The header and footer around this page are the live versions.'
        >
            <Group label='Wordmark sizes'>
                <Row gap={7} align='center'>
                    <Wordmark />
                    <Wordmark size='lg' />
                </Row>
            </Group>
            <Group label='Radio chip: connecting, one node, several nodes'>
                <Row gap={3}>
                    <RadioChipView connecting words='Connecting' label='Connecting to a node' />
                    <RadioChipView
                        connecting={false}
                        words='Ridge 3'
                        label='Connected to Ridge 3'
                    />
                    <RadioChipView
                        connecting={false}
                        words='3 connected'
                        label='Connected to three nodes'
                    />
                </Row>
            </Group>
            <Group label='Units toggle'>
                <Row>
                    <UnitsToggle />
                </Row>
            </Group>
            <Group label='Node counter: footer and inline'>
                <Grid columns={2} gap={3}>
                    <Box tone='surface-2'>
                        <NodeCounter />
                    </Box>
                    <Box>
                        <NodeCounter tone='inline' />
                    </Box>
                </Grid>
            </Group>
        </Specimen>
    )
}
