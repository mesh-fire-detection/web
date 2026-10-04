import type { FirmwareContent } from '@core/content/types'
import { MFD_BUILD as build, MFD_UF2 } from '@core/nearby/firmware'

export const firmwareContent = {
    title: 'Firmware',
    eyebrow: `RAK10722 · MFD build ${build}`,
    lede: 'Install MFD firmware on the RAK10722 Starter Kit (RAK4631 core) over USB, in your browser.',
    connectCta: 'Connect a Node',
    meshtastic: {
        label: 'Official Meshtastic Flasher',
        href: 'https://flasher.meshtastic.org',
    },
    firmwareRepo: {
        label: 'MFD firmware on GitHub',
        href: 'https://github.com/mesh-fire-detection/firmware',
    },
    usb: {
        title: 'Update over USB',
        lede: 'Use Chrome or Edge on a computer. This updater does not erase settings, keys or channels.',
        enter: 'Enter update mode',
        flash: 'Flash firmware',
        unsupported:
            'This browser cannot complete USB flashing here. Use Chrome or Edge on a computer, or use the official Meshtastic Flasher.',
        uf2Href: MFD_UF2.href,
        uf2Name: MFD_UF2.name,
        uf2Sha256: MFD_UF2.sha256,
        steps: [
            'Plug in the node with a USB data cable. Disconnect it on Connect a Node and close other apps using it. Press Enter update mode and select its USB port.',
            'When the RAK4631 drive appears, press Flash firmware, select that drive and allow access.',
            `Wait for the node to restart. Reconnect on Connect a Node and check that its build is ${build}.`,
        ],
        driveHelp:
            'RAK4631 drive already visible? Skip Enter update mode. No drive? Quickly press the node’s reset button twice.',
        states: {
            idle: '',
            rebooting: 'Asking the node to restart into update mode…',
            bootloader: 'Wait for the RAK4631 drive, then press Flash firmware.',
            selecting: 'Choose the RAK4631 drive…',
            fetching: 'Loading and checking the firmware…',
            writing: 'Writing the firmware onto the drive…',
            done: 'Firmware copied. Reconnect the node to confirm its build.',
            busy: 'The port is already open. Disconnect it on Connect a Node or in another app and try again.',
            timeout:
                'The node did not answer. Quickly press its reset button twice, then select the RAK4631 drive with Flash firmware.',
            failed: 'Update could not be confirmed. Reconnect and check the build before retrying.',
            wrongDrive: 'That folder is not a RAK4631 bootloader drive. Choose the RAK4631 drive.',
        },
    },
    update: {
        title: 'Firmware update',
        status: {
            current: 'Up to date',
            outdated: `An older MFD build is installed. Update to ${build}.`,
            other: `This node runs another firmware build. Install MFD ${build} to use it in the network.`,
            unknown: 'The node has not reported its firmware version yet.',
        },
        steps: [
            'Disconnect this node here and plug it into your computer over USB.',
            'Open Firmware below. Press Enter update mode, then Flash firmware and choose the RAK4631 drive.',
            'Reconnect here after the restart and check the build.',
        ],
        cta: 'Open Firmware',
        keepNote: 'Chrome or Edge on a computer. Updating keeps settings; do not factory erase.',
    },
} as const satisfies FirmwareContent
