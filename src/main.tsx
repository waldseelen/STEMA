import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import { I18nProvider } from './i18n'
import { ensureInitialAuthBootstrap } from './modules/auth/store/authStore'
import { initA11yLiveRegions } from './shared/utils/a11y'

// Self-hosted fonts (latin subsets only) - reduces font payload
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/jetbrains-mono/latin-300.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '@fontsource/jetbrains-mono/latin-700.css'

import './index.css'

async function bootstrap() {
    initA11yLiveRegions()
    await ensureInitialAuthBootstrap()

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <I18nProvider>
                <App />
            </I18nProvider>
        </React.StrictMode>,
    )
}

void bootstrap()
