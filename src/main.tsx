import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'

// Stylesheets are global. Importing them all here makes the cascade order
// explicit instead of dependent on module resolution order.
import './styles/tokens.css'
import './styles/global.css'
import './styles/ui.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/pages.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root is missing from index.html')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
