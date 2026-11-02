import { describe, expect, it } from 'vitest'

import { draftOf, parseDraft } from '@components/pages/nodes/editing'

import { BENCH } from './fixtures'

describe('editing a node', () => {
    it('starts from the exact position, and saves every field it shows', () => {
        const draft = draftOf(BENCH)

        expect(draft).toMatchObject({ latitude: '47.4402', longitude: '-121.7861', type: 'none' })
        expect(parseDraft({ ...draft, type: 'sensor', antennaHeightM: ' 4 ' })).toEqual({
            ok: true,
            changes: {
                name: 'Bench node',
                type: 'sensor',
                position: [-121.7861, 47.4402],
                elevationM: 187,
                antennaHeightM: 4,
                deployedOn: null,
                note: 'On the shelf above the bench.',
                exactPosition: false,
            },
        })
    })

    it('clears the position when both halves are emptied', () => {
        const parsed = parseDraft({ ...draftOf(BENCH), latitude: '', longitude: '' })

        expect(parsed).toMatchObject({ ok: true, changes: { position: null } })
    })

    it('names each field the server would refuse', () => {
        const parsed = parseDraft({
            ...draftOf(BENCH),
            name: '  ',
            latitude: '95',
            longitude: 'west',
            elevationM: 'high',
            deployedOn: 'May 20',
        })

        expect(parsed).toEqual({
            ok: false,
            errors: {
                name: 'Enter a name.',
                latitude: 'Enter a latitude between -90 and 90.',
                longitude: 'Enter a longitude between -180 and 180.',
                elevationM: 'Enter a number, or leave it empty.',
                deployedOn: 'Use the form YYYY-MM-DD.',
            },
        })
    })

    it('asks for both halves of a position, or neither', () => {
        const parsed = parseDraft({ ...draftOf(BENCH), longitude: '' })

        expect(parsed).toEqual({
            ok: false,
            errors: { latitude: 'Enter both latitude and longitude, or neither.' },
        })
    })
})
