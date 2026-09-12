import { useUnitSystem } from '@components/app/UnitsProvider'
import { Row } from '@components/shared/primitives/Layout'
import { Pressable } from '@components/shared/primitives/Pressable'
import { Text } from '@components/shared/typography/Text'
import { cx } from '@core/format/cx'
import type { UnitSystem } from '@core/format/units'

const OPTIONS = [
    { value: 'imperial', label: 'mi' },
    { value: 'metric', label: 'km' },
] as const satisfies readonly { value: UnitSystem; label: string }[]

export function UnitsToggle() {
    const { system, setSystem } = useUnitSystem()

    return (
        <Row ariaLabel='Units' className='segmented' gap={0} role='group' wrap={false}>
            {OPTIONS.map((option) => (
                <Pressable
                    className={cx('segmented_item', option.value === system && 'segmented_item_on')}
                    key={option.value}
                    onActivate={() => {
                        setSystem(option.value)
                    }}
                    pressed={option.value === system}
                    role='button'
                >
                    <Text as='span' mono size='xs' tone='inherit' weight={600}>
                        {option.label}
                    </Text>
                </Pressable>
            ))}
        </Row>
    )
}
