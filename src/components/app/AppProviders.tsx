import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { NavMenuProvider } from '@components/app/NavMenuProvider'

type AppProvidersProperties = {
    readonly children: ReactNode
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const AppProviders = ({ children }: AppProvidersProperties) => {
    return (
        <BrowserRouter basename={basename}>
            <NavMenuProvider>{children}</NavMenuProvider>
        </BrowserRouter>
    )
}
