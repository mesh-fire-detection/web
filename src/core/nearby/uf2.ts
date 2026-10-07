/** The UF2 bootloader advertises itself with this file on the mounted drive. */
export const UF2_INFO = 'INFO_UF2.TXT'

export type Uf2DirectoryHandle = {
    getFileHandle: (
        name: string,
        options?: { create?: boolean }
    ) => Promise<{
        getFile: () => Promise<{ text: () => Promise<string> }>
        createWritable: () => Promise<{
            write: (data: Uint8Array) => Promise<void>
            close: () => Promise<void>
            abort: () => Promise<void>
        }>
    }>
}

export function drivePickerSupport(): boolean {
    return (
        typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker ===
        'function'
    )
}

/** Opens the folder picker so the builder can choose the RAK4631 drive. */
export async function pickUf2Drive(): Promise<Uf2DirectoryHandle> {
    const picker = (
        window as Window & {
            showDirectoryPicker?: (options?: {
                id?: string
                mode?: string
            }) => Promise<Uf2DirectoryHandle>
        }
    ).showDirectoryPicker
    if (typeof picker !== 'function') {
        throw new DOMException('This browser cannot write to a drive', 'NotSupportedError')
    }
    return picker.call(window, { id: 'mfd-uf2', mode: 'readwrite' })
}

export async function fetchUf2(url: string, sha256: string): Promise<Uint8Array<ArrayBuffer>> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new DOMException(
            `Could not load firmware (${String(response.status)})`,
            'NetworkError'
        )
    }
    const bytes = new Uint8Array(await response.arrayBuffer())
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
    const actual = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
    if (actual !== sha256) {
        throw new DOMException('Firmware checksum does not match the release', 'OperationError')
    }
    return bytes
}

/**
 * Writes the checked release onto a RAK4631 bootloader drive. A write failure,
 * including an unmount, cannot establish success; reconnect to confirm the build.
 */
export async function writeUf2ToDrive(
    bytes: Uint8Array,
    fileName: string,
    directory: Uf2DirectoryHandle
): Promise<void> {
    try {
        const handle = await directory.getFileHandle(UF2_INFO)
        const info = await handle.getFile()
        if (!/^Board-ID:.*\bRAK4631\b/im.test(await info.text())) {
            throw new DOMException('The bootloader belongs to another board', 'DataError')
        }
    } catch {
        throw new DOMException('The chosen folder is not a UF2 bootloader drive', 'DataError')
    }
    const file = await directory.getFileHandle(fileName, { create: true })
    const writable = await file.createWritable()
    try {
        await writable.write(bytes)
        await writable.close()
    } catch (error) {
        try {
            await writable.abort()
        } catch {
            // An unmounted drive may no longer expose a stream to abort.
        }
        throw error
    }
}
