import { isButtonActivationKey } from '@core/a11y/keys'

/**
 * Enter/Space for `role='button'`. Prefer `Pressable` for activate-on-click
 * controls that are not native anchors.
 */
export const activationKeyDown = (
    event: { key: string; preventDefault: () => void },
    activate: () => void
): void => {
    if (!isButtonActivationKey(event.key)) return

    event.preventDefault()
    activate()
}

/**
 * Native links activate on Enter only; Space scrolls the page. Use this when
 * a neutral element still carries `role='link'` (e.g. SkipLink).
 */
export const linkActivationKeyDown = (
    event: { key: string; preventDefault: () => void },
    activate: () => void
): void => {
    if (event.key !== 'Enter') return

    event.preventDefault()
    activate()
}
