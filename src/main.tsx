import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'

import './assets/styles/index.css'
import './assets/maplibre.css'

const container = document.querySelector('#root')
if (!container) throw new Error('Root element #root is missing from index.html')

// Vite's BASE_URL always has a trailing slash; React Router's basename must not.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(container).render(
    <StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </StrictMode>
)
