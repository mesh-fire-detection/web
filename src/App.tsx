import { Route, Routes } from 'react-router-dom'
import { SkipLink } from './ui'
import { Header } from './layout/Header'
import { Footer } from './layout/Footer'
import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { BuildPage } from './pages/BuildPage'
import { CoveragePage } from './pages/CoveragePage'
import { OpenProblemsPage } from './pages/OpenProblemsPage'
import { AboutPage } from './pages/AboutPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <>
      <SkipLink to="#main">Skip to content</SkipLink>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/coverage" element={<CoveragePage />} />
        <Route path="/open-problems" element={<OpenProblemsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  )
}
