import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@components/app/AppEntry'
import { AppProviders } from '@components/app/AppProviders'
import '@assets/styles/index.css'
import '@assets/maplibre.css'

const container = document.querySelector('#root')
if (!container) throw new Error('Root element #root is missing from index.html')

createRoot(container).render(
    <StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </StrictMode>
)
