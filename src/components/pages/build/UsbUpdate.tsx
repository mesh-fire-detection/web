import { useUsbUpdate } from '@components/pages/build/useUsbUpdate'
import { Row, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import type { Tone } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { firmwareContent } from '@core/content/build/firmware'
import type { DfuState } from '@core/nearby/firmware'

const copy = firmwareContent.usb

const STATE_TONE: Readonly<Record<DfuState, Tone>> = {
    idle: 'muted',
    rebooting: 'muted',
    bootloader: 'live',
    selecting: 'muted',
    fetching: 'muted',
    writing: 'muted',
    done: 'live',
    busy: 'warn',
    timeout: 'warn',
    failed: 'warn',
    wrongDrive: 'warn',
}

function UpdateActions() {
    const { state, support, canWrite, busy, enterUpdateMode, flashFirmware } = useUsbUpdate()
    return (
        <Stack gap={2}>
            <Row gap={3}>
                <Button
                    variant='secondary'
                    className='nearby_add_usb'
                    iconBefore={<Icon name='usb' />}
                    disabled={support !== 'available' || busy}
                    onClick={() => {
                        void enterUpdateMode()
                    }}
                >
                    {copy.enter}
                </Button>
                <Button
                    variant='primary'
                    disabled={!canWrite || busy}
                    onClick={() => {
                        void flashFirmware()
                    }}
                >
                    {copy.flash}
                </Button>
            </Row>
            {support === 'available' && canWrite ? null : (
                <Text size='xs' tone='faint'>
                    {copy.unsupported}
                </Text>
            )}
            <div className='firmware_status'>
                <div className='firmware_status_space' aria-hidden='true'>
                    {Object.entries(copy.states).map(([key, message]) => (
                        <Text key={key} size='xs'>
                            {message}
                        </Text>
                    ))}
                </div>
                <div role='status'>
                    <Text size='xs' tone={STATE_TONE[state]}>
                        {copy.states[state]}
                    </Text>
                </div>
            </div>
        </Stack>
    )
}

/** Our own flashing path: reboot into the bootloader here, then write the UF2 onto that drive. */
export function UsbUpdate() {
    return (
        <Stack gap={5}>
            <Stack gap={2}>
                <Heading level={2} size='md'>
                    {copy.title}
                </Heading>
                <Text size='sm' tone='muted'>
                    {copy.lede}
                </Text>
            </Stack>
            <Stack gap={0} className='steps'>
                {copy.steps.map((step, index) => (
                    <Row key={step} gap={4} align='start' wrap={false} className='steps_row'>
                        <Text
                            as='div'
                            size='xs'
                            mono
                            weight={600}
                            tone='fire'
                            className='steps_num'
                        >
                            {String(index + 1).padStart(2, '0')}
                        </Text>
                        <Stack gap={3} minWidth0>
                            <Text size='sm' tone='muted' measure={82}>
                                {step}
                            </Text>
                        </Stack>
                    </Row>
                ))}
            </Stack>
            <Text size='xs' tone='faint'>
                {copy.driveHelp}
            </Text>
            <UpdateActions />
        </Stack>
    )
}
