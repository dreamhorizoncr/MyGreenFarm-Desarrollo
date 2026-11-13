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

await i18n.changeLanguage(i18n.language).catch(() => undefined)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
