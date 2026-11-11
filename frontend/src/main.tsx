import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from './i18n/index.ts'
import './index.css'
import App from './App.tsx'
import { installModalScrollbars } from './utils/modalScrollbars.ts'
import { installReducedMotionBridge } from './utils/reducedMotion.ts'
import { preloadListCounts } from './services/listCounts.ts'
import { heroImage } from './pages/home/heroImage.ts'

// The home hero is the largest thing on the first screen: start fetching it before React renders.
if (window.location.pathname === '/') {
  const preload = document.createElement('link')
  preload.rel = 'preload'
  preload.as = 'image'
  preload.href = heroImage.src
  preload.imageSrcset = heroImage.srcSet
  preload.imageSizes = heroImage.sizes
  preload.fetchPriority = 'high'
  document.head.append(preload)
}

preloadListCounts()
installReducedMotionBridge()
installModalScrollbars()

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Load the detected language before the first render. resolvedLanguage still says "es"
// until that language has been downloaded, so i18n.language is used instead.
i18n
  .changeLanguage(i18n.language)
  .catch(() => undefined)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
