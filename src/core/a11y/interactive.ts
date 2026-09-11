import { isActivationKey } from '@core/a11y/keys'

/**
 * The site navigates with neutral elements instead of `a`/`button`, so
 * Enter/Space activation has to be re-implemented wherever something is
 * clickable. Prefer `Pressable` for activate-on-click controls.
 */
export const activationKeyDown = (
    event: { key: string; preventDefault: () => void },
    activate: () => void
): void => {
    if (!isActivationKey(event.key)) return

    event.preventDefault()
    activate()
}
