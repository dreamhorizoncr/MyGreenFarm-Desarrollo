import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.ts'
import './index.css'
import App from './App.tsx'

window.addEventListener("unhandledrejection", (event) => {
  console.error("Promesa rechazada no manejada:", event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
