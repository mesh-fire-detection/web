import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { MFD_UF2 } from '@core/nearby/firmware'
import { fetchUf2, UF2_INFO, writeUf2ToDrive } from '@core/nearby/uf2'
import type { Uf2DirectoryHandle } from '@core/nearby/uf2'

function fileHandle(
    write: (data: Uint8Array) => void | Promise<void>,
    board = 'WisBlock-RAK4631-Board'
): Awaited<ReturnType<Uf2DirectoryHandle['getFileHandle']>> {
    return {
        getFile: () => Promise.resolve({ text: () => Promise.resolve(`Board-ID: ${board}\n`) }),
        createWritable: () =>
            Promise.resolve({
                write: (data: Uint8Array) => Promise.resolve(write(data)),
                close: () => Promise.resolve(),
                abort: () => Promise.resolve(),
            }),
    }
}

function fakeDrive(hasInfo: boolean, board = 'WisBlock-RAK4631-Board') {
    const written: Record<string, Uint8Array> = {}
    return {
        written,
        directory: {
            getFileHandle: (name: string, options?: { create?: boolean }) => {
                const missing =
                    (name === UF2_INFO && !hasInfo) || (name !== UF2_INFO && !options?.create)
                return missing
                    ? Promise.reject(new Error('missing'))
                    : Promise.resolve(
                          fileHandle((data) => {
                              written[name] = data
                          }, board)
                      )
            },
        },
    }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('UF2 drive write', () => {
    it('writes the firmware onto a RAK4631 bootloader drive', async () => {
        const payload = new Uint8Array([1, 2, 3])
        const drive = fakeDrive(true)
        await writeUf2ToDrive(payload, 'firmware.uf2', drive.directory)
        expect(drive.written['firmware.uf2']).toEqual(payload)
    })

    it.each([
        { hasInfo: false, board: 'WisBlock-RAK4631-Board' },
        { hasInfo: true, board: 'Raspberry-Pi-RP2040' },
    ])('refuses the wrong drive: $board, hasInfo=$hasInfo', async ({ hasInfo, board }) => {
        const drive = fakeDrive(hasInfo, board)
        await expect(
            writeUf2ToDrive(new Uint8Array([1]), 'firmware.uf2', drive.directory)
        ).rejects.toMatchObject({ name: 'DataError' })
        expect(drive.written).toEqual({})
    })

    it.each(['AbortError', 'QuotaExceededError', 'NotAllowedError'])(
        'never claims success when writing fails with %s',
        async (name) => {
            const directory: Uf2DirectoryHandle = {
                getFileHandle: () =>
                    Promise.resolve(
                        fileHandle(() => {
                            throw new DOMException('Write failed', name)
                        })
                    ),
            }
            await expect(
                writeUf2ToDrive(new Uint8Array([9]), 'firmware.uf2', directory)
            ).rejects.toMatchObject({ name })
        }
    )

    it('propagates a failure to close the stream', async () => {
        const directory: Uf2DirectoryHandle = {
            getFileHandle: () =>
                Promise.resolve({
                    ...fileHandle(() => {}),
                    createWritable: () =>
                        Promise.resolve({
                            write: () => Promise.resolve(),
                            close: () =>
                                Promise.reject(new DOMException('Unmounted', 'AbortError')),
                            abort: () => Promise.resolve(),
                        }),
                }),
        }
        await expect(
            writeUf2ToDrive(new Uint8Array([9]), 'firmware.uf2', directory)
        ).rejects.toMatchObject({ name: 'AbortError' })
    })
})

describe('fetchUf2', () => {
    const payload = new Uint8Array([4, 5])
    const sha256 = createHash('sha256').update(payload).digest('hex')

    it('returns checksum-verified bytes', async () => {
        vi.stubGlobal('crypto', webcrypto)
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(payload, { status: 200 })))
        )
        await expect(fetchUf2('/firmware.uf2', sha256)).resolves.toEqual(payload)
    })

    it('rejects a corrupt file or HTML fallback with HTTP 200', async () => {
        vi.stubGlobal('crypto', webcrypto)
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response('<html>Not found</html>')))
        )
        await expect(fetchUf2('/firmware.uf2', sha256)).rejects.toMatchObject({
            name: 'OperationError',
        })
    })

    it('rejects a missing file', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 404 })))
        )
        await expect(fetchUf2('/missing.uf2', sha256)).rejects.toMatchObject({
            name: 'NetworkError',
        })
    })

    it('bundles the pinned artifact and matching checksum on this site', () => {
        const artifact = readFileSync(`public/files/${MFD_UF2.name}`)
        expect(createHash('sha256').update(artifact).digest('hex')).toBe(MFD_UF2.sha256)
        expect(readFileSync('public/files/firmware-SHA256SUMS', 'utf8')).toBe(
            `${MFD_UF2.sha256}  ${MFD_UF2.name}\n`
        )
        expect(MFD_UF2.href).toBe(`${import.meta.env.BASE_URL}files/${MFD_UF2.name}`)
    })
})
