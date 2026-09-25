import { SITE } from '@core/config/site'
import type { LegalContent } from '@core/content/types'

const CONTACT = SITE.contact.replace('mailto:', '')

export const privacyContent = {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    lede: 'What the website and the network service collect, why, where it is stored and how to have it removed. Written to be read, not skimmed past.',
    updatedOn: '2026-09-17',
    summary: {
        title: 'The short version',
        body: 'The public website sets no cookies and runs no analytics. Personal data exists only for people with an invited account on the network service: an email address, a name, a password hash and session records.',
    },
    sections: [
        {
            id: 'who',
            title: 'Who is responsible',
            paragraphs: [
                `${SITE.name} is an open hardware project run by its maintainers. They decide what data is collected and how it is used. Questions and requests go to ${CONTACT}.`,
            ],
        },
        {
            id: 'website',
            title: `The public website (${SITE.url.replace('https://', '')})`,
            paragraphs: [
                'The site is a static page. It has no analytics, no advertising, no tracking pixels, no cookies and no third-party scripts.',
                'It is served by GitHub Pages. GitHub receives every request, including your IP address and browser details, and processes them under its own privacy statement. We do not receive these logs.',
            ],
            items: [
                'Your choice of metric or imperial units is kept in your browser’s local storage so it survives a reload. It never leaves your device, and clearing site data removes it.',
                'By default the map draws node geometry on a blank canvas and requests no map tiles. If a basemap is ever enabled, the tile provider will see your IP address, and this policy will name that provider first.',
                'Links to GitHub and email take you to those services, which have their own policies.',
            ],
        },
        {
            id: 'accounts',
            title: 'Network service accounts',
            paragraphs: [
                'The network service (the API and its dashboard) has no open sign-up. Accounts exist only for people an administrator has invited. For them we store:',
            ],
            items: [
                'Email address and name, to identify you and to send the invitation.',
                'A password hash. The password itself is never stored.',
                'Session records: a session token, its expiry, and the IP address and browser user agent that opened it, to keep you signed in and to spot misuse.',
                'A strictly necessary session cookie, set only after you sign in. It is not used for tracking.',
                'Your role, who invited you, and the alert rules you create.',
            ],
        },
        {
            id: 'network-data',
            title: 'Sensor and node data',
            paragraphs: [
                'Nodes report readings, battery and radio metrics. This is data about equipment and terrain, not about people. Node positions are published on purpose, only on public land or on land whose owner agreed in writing.',
                'Vision nodes point at terrain, not at roads, homes or trailheads. If a frame accidentally shows a person, it is not used to identify them and is removed on request.',
            ],
        },
        {
            id: 'basis',
            title: 'Why we are allowed to process it',
            paragraphs: [
                'Account data is processed to provide the service you were invited to use (performing that arrangement). Session and security data is processed in our legitimate interest in keeping the service secure. We do not sell data, profile users or use it for advertising.',
            ],
        },
        {
            id: 'storage',
            title: 'Where it is stored and for how long',
            items: [
                'The service runs on a single virtual server hosted by Hetzner. Traffic to the API passes through Cloudflare.',
                'The database is continuously backed up to encrypted object storage (Cloudflare R2 or Backblaze B2).',
                'Account data is kept while your account exists and deleted when it is closed; backups roll over after that.',
                'Sensor and node data is kept indefinitely, because a long record is the point of the project.',
            ],
        },
        {
            id: 'rights',
            title: 'Your rights',
            paragraphs: [
                `You can ask to see, correct, export or delete the personal data we hold about you, or object to how it is used. Write to ${CONTACT}; we answer within 30 days. If you are in the EU or UK, you can also complain to your data protection authority.`,
            ],
        },
        {
            id: 'children',
            title: 'Children',
            paragraphs: [
                'The network service is not intended for anyone under 16, and we do not knowingly hold their data.',
            ],
        },
        {
            id: 'changes',
            title: 'Changes',
            paragraphs: [
                'Changes to this policy are made in the public repository, so every revision and its date is visible in the history. The date at the top shows the latest one.',
            ],
        },
    ],
} as const satisfies LegalContent

export const termsContent = {
    title: 'Terms of Use',
    eyebrow: 'Legal',
    lede: 'The conditions for using this website, the network map and the network service. The most important one comes first.',
    updatedOn: '2026-09-17',
    summary: {
        title: 'This is not an emergency service',
        body: 'Nothing here is monitored around the clock, and a missing alert does not mean there is no fire. If you see fire or smoke, call your local emergency number (911, 112 or equivalent) and follow official evacuation orders.',
    },
    sections: [
        {
            id: 'acceptance',
            title: 'Using the site',
            paragraphs: [
                `By using the website or the network service you agree to these terms. If you do not agree, do not use them. Questions go to ${CONTACT}.`,
            ],
        },
        {
            id: 'experimental',
            title: 'An experimental project',
            paragraphs: [
                `${SITE.name} is an open, volunteer-run experiment. Detection performance, false-positive rates and coverage are not yet measured, and the site says so where it matters.`,
            ],
            items: [
                'Nodes fail, lose power, lose radio links and report late. The map can be incomplete, stale or wrong.',
                'Readings and alerts are not verified by a human and are not forwarded to any fire agency.',
                'The network does not replace official warning systems, lookouts, cameras or your own judgement.',
            ],
        },
        {
            id: 'no-warranty',
            title: 'No warranty',
            paragraphs: [
                'The website, the data, the network service, the designs and the software are provided “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, availability and non-infringement.',
            ],
        },
        {
            id: 'liability',
            title: 'Limitation of liability',
            paragraphs: [
                'To the maximum extent permitted by law, the maintainers and contributors are not liable for any loss or damage arising from use of, or reliance on, the website, the data or the network service — including property damage, injury, or loss caused by a fire that was not detected, detected late or reported incorrectly. Nothing in these terms limits liability that cannot be limited by law.',
            ],
        },
        {
            id: 'building',
            title: 'Building and deploying nodes',
            paragraphs: [
                'Build guides, parts lists and enclosure files are published to help, not as certified instructions. You are responsible for your own build and deployment.',
            ],
            items: [
                'Follow local radio regulations for your frequency band and transmit power.',
                'Get permission from the land owner or land manager before installing anything, and respect fire restrictions while you do it.',
                'Batteries, solar charging and working at height carry real risks. Take the precautions they call for.',
                'Prices and availability in the parts list change and are not offers.',
            ],
        },
        {
            id: 'licenses',
            title: 'Licences',
            paragraphs: [
                `Hardware designs and documentation are licensed under ${SITE.licenses.hardware.name}; firmware and this site under ${SITE.licenses.firmware.name}. Those licences govern reuse of the designs and code and have their own warranty disclaimers.`,
            ],
        },
        {
            id: 'accounts',
            title: 'Network service accounts',
            items: [
                'Accounts are by invitation only. Keep your password to yourself; you are responsible for activity on your account.',
                'Do not attempt to access data or functions your role does not allow, disrupt the service, or submit false node data.',
                'We may suspend or remove an account that breaks these terms or endangers the service.',
                'The public map feed may be reused; please credit the project and do not present it as an official warning source.',
            ],
        },
        {
            id: 'external',
            title: 'Other services',
            paragraphs: [
                'Links to GitHub, parts stores and other sites lead to services we do not control. Their terms apply there.',
            ],
        },
        {
            id: 'changes',
            title: 'Changes',
            paragraphs: [
                'These terms may change as the project grows. Changes are made in the public repository, and the date at the top shows the latest revision. Continuing to use the site after a change means you accept it.',
            ],
        },
    ],
} as const satisfies LegalContent
