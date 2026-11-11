import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { HERO_SIZES } from './src/pages/home/heroSizes.ts'

// The home hero is the largest thing on the first screen. This writes a tiny script into
// index.html that asks for it right away on the home page, before the JavaScript bundle loads.
function heroPreload(): Plugin {
  return {
    name: 'mgf-hero-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const assets = Object.values(ctx.bundle ?? {}).filter((file) => file.type === 'asset')
        const find = (name: string) => assets.find((file) => file.names?.includes(name))?.fileName
        const small = find('temporaryHeader-640.webp')
        const medium = find('temporaryHeader-960.webp')
        const large = find('temporaryHeader.webp')
        if (!small || !medium || !large) return html
        const script = `<script>if(location.pathname==='/'){var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';l.href='/${large}';l.imageSrcset='/${small} 640w, /${medium} 960w, /${large} 1204w';l.imageSizes='${HERO_SIZES}';document.head.appendChild(l)}</script>`
        return html.replace('</title>', `</title>\n    ${script}`)
      },
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), heroPreload()],
})
