import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@components/app/ErrorBoundary'
import { useNavMenu } from '@components/app/NavMenuProvider'
import { Footer } from '@components/layout/Footer'
import { Header } from '@components/layout/Header'
import { BuildPage } from '@components/pages/Build'
import { CoveragePage } from '@components/pages/coverage/Coverage'
import { HomePage } from '@components/pages/Home'
import { MapPage } from '@components/pages/Map'
import { OpenProblemsPage } from '@components/pages/problems/OpenProblems'
import { AboutPage } from '@components/pages/site/About'
import { PrivacyPage, TermsPage } from '@components/pages/site/Legal'
import { NotFoundPage } from '@components/pages/site/NotFound'
import { SkipLink } from '@components/shared/widgets/Action'
import { APP_ROUTES, type RouteId } from '@core/config/routes'

/**
 * Exhaustive by construction: `Record<RouteId, …>` fails to type-check until a
 * route added to `APP_ROUTES` has a page here.
 */
const PAGES: Record<RouteId, ComponentType> = {
    home: HomePage,
    map: MapPage,
    build: BuildPage,
    coverage: CoveragePage,
    open_problems: OpenProblemsPage,
    about: AboutPage,
    privacy: PrivacyPage,
    terms: TermsPage,
}

const AppEntry = () => {
    const { open } = useNavMenu()

    return (
        <>
            <div inert={open ? true : undefined}>
                <SkipLink to='#main'>Skip to content</SkipLink>
            </div>
            <Header />
            <div inert={open ? true : undefined}>
                <Routes>
                    {APP_ROUTES.map((route) => {
                        const Page = PAGES[route.id]
                        return <Route key={route.id} element={<Page />} path={route.path} />
                    })}
                    <Route element={<NotFoundPage />} path='*' />
                </Routes>
                <Footer />
            </div>
        </>
    )
}

export const App = () => {
    return (
        <ErrorBoundary mode='landmark'>
            <AppEntry />
        </ErrorBoundary>
    )
}
