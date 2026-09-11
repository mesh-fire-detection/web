import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@components/app/ErrorBoundary'
import { Footer } from '@components/layout/Footer'
import { Header } from '@components/layout/Header'
import { AboutPage } from '@components/pages/About'
import { BuildPage } from '@components/pages/Build'
import { CoveragePage } from '@components/pages/coverage/Coverage'
import { HomePage } from '@components/pages/Home'
import { MapPage } from '@components/pages/Map'
import { NotFoundPage } from '@components/pages/NotFound'
import { OpenProblemsPage } from '@components/pages/problems/OpenProblems'
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
}

const AppEntry = () => {
    return (
        <>
            <SkipLink to='#main'>Skip to content</SkipLink>
            <Header />
            <Routes>
                {APP_ROUTES.map((route) => {
                    const Page = PAGES[route.id]
                    return <Route key={route.id} element={<Page />} path={route.path} />
                })}
                <Route element={<NotFoundPage />} path='*' />
            </Routes>
            <Footer />
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
