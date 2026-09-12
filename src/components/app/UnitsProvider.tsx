import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import {
    DEFAULT_UNIT_SYSTEM,
    parseUnitSystem,
    UNITS_STORAGE_KEY,
    type UnitSystem,
} from '@core/format/units'

type UnitsValue = {
    readonly system: UnitSystem
    readonly setSystem: (next: UnitSystem) => void
}

const UnitsContext = createContext<UnitsValue | null>(null)

const readStored = (): UnitSystem => {
    try {
        return parseUnitSystem(window.localStorage.getItem(UNITS_STORAGE_KEY))
    } catch {
        return DEFAULT_UNIT_SYSTEM
    }
}

const writeStored = (system: UnitSystem): void => {
    try {
        window.localStorage.setItem(UNITS_STORAGE_KEY, system)
    } catch {
        // Private mode and quota errors leave the in-memory choice intact.
    }
}

type UnitsProviderProperties = {
    readonly children: ReactNode
}

export const UnitsProvider = ({ children }: UnitsProviderProperties) => {
    const [system, setSystem] = useState<UnitSystem>(readStored)

    const persistSystem = useCallback((next: UnitSystem) => {
        setSystem(next)
        writeStored(next)
    }, [])

    const value = useMemo(() => ({ system, setSystem: persistSystem }), [system, persistSystem])

    return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
}

export const useUnitSystem = (): UnitsValue => {
    const value = useContext(UnitsContext)
    if (value === null) {
        throw new Error('useUnitSystem must be used within UnitsProvider')
    }
    return value
}
