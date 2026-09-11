import { Route, Routes } from 'react-router-dom'

import { Footer } from './layout/Footer'
import { Header } from './layout/Header'
import { AboutPage } from './pages/AboutPage'
import { BuildPage } from './pages/BuildPage'
import { CoveragePage } from './pages/CoveragePage'
import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OpenProblemsPage } from './pages/OpenProblemsPage'
import { SkipLink } from './ui'

export function App() {
    return (
        <>
            <SkipLink to='#main'>Skip to content</SkipLink>
            <Header />
            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/map' element={<MapPage />} />
                <Route path='/build' element={<BuildPage />} />
                <Route path='/coverage' element={<CoveragePage />} />
                <Route path='/open-problems' element={<OpenProblemsPage />} />
                <Route path='/about' element={<AboutPage />} />
                <Route path='*' element={<NotFoundPage />} />
            </Routes>
            <Footer />
        </>
    )
}
