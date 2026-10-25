import { useUnitSystem } from '@components/app/UnitsProvider'
import { SegmentedControl } from '@components/shared/forms/ChoiceFields'
import type { UnitSystem } from '@core/format/units'

const OPTIONS = [
    { value: 'imperial', label: 'mi' },
    { value: 'metric', label: 'km' },
] as const satisfies readonly { value: UnitSystem; label: string }[]

export function UnitsToggle() {
    const { system, setSystem } = useUnitSystem()

    return (
        <SegmentedControl ariaLabel='Units' onChange={setSystem} options={OPTIONS} value={system} />
    )
}
