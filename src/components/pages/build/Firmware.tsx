import { Page } from '@components/layout/Page'
import { UsbUpdate } from '@components/pages/build/UsbUpdate'
import { Box, Row, Section } from '@components/shared/primitives/Layout'
import { ButtonAnchor, ButtonLink } from '@components/shared/widgets/Action'
import { Icon } from '@components/shared/widgets/Icon'
import { firmwareContent as copy } from '@core/content/build/firmware'

export function FirmwarePage() {
    return (
        <Page
            title={copy.title}
            eyebrow={copy.eyebrow}
            lede={copy.lede}
            aside={
                <Row gap={3}>
                    <ButtonLink
                        to='/connect'
                        variant='secondary'
                        className='firmware_connect'
                        iconBefore={<Icon name='usb' />}
                        iconAfter={<Icon name='arrow-up-right' />}
                    >
                        {copy.connectCta}
                    </ButtonLink>
                    <ButtonAnchor
                        href={copy.meshtastic.href}
                        className='firmware_external'
                        iconAfter={<Icon name='arrow-up-right' />}
                    >
                        {copy.meshtastic.label}
                    </ButtonAnchor>
                    <ButtonAnchor
                        href={copy.firmwareRepo.href}
                        className='firmware_external'
                        iconAfter={<Icon name='arrow-up-right' />}
                    >
                        {copy.firmwareRepo.label}
                    </ButtonAnchor>
                </Row>
            }
        >
            <Section space='md' id='update'>
                <Box tone='surface' padding={6} radius='md'>
                    <UsbUpdate />
                </Box>
            </Section>
        </Page>
    )
}
