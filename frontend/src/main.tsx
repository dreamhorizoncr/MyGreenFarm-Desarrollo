import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from './i18n/index.ts'
import './index.css'
import App from './App.tsx'
import { installModalScrollbars } from './utils/modalScrollbars.ts'
import { installReducedMotionBridge } from './utils/reducedMotion.ts'
import { preloadListCounts } from './services/listCounts.ts'

preloadListCounts()
installReducedMotionBridge()
installModalScrollbars()

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Load the detected language before the first render. resolvedLanguage still says "es"
// until that language has been downloaded, so i18n.language is used instead.
try {
  await i18n.changeLanguage(i18n.language)
} catch {
  // The page still renders; i18next falls back to the default language.
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
