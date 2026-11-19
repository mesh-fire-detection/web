import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { NavMenuProvider } from '@components/app/NavMenuProvider'
import { RadioProvider } from '@components/app/RadioProvider'
import { SessionProvider } from '@components/app/SessionProvider'
import { UnitsProvider } from '@components/app/UnitsProvider'

type AppProvidersProperties = {
    readonly children: ReactNode
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const AppProviders = ({ children }: AppProvidersProperties) => {
    return (
        <BrowserRouter basename={basename}>
            <SessionProvider>
                <UnitsProvider>
                    <RadioProvider>
                        <NavMenuProvider>{children}</NavMenuProvider>
                    </RadioProvider>
                </UnitsProvider>
            </SessionProvider>
        </BrowserRouter>
    )
}
