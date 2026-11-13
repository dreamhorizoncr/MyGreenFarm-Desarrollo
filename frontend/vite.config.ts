import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { HEADER_BG_SIZES } from './src/pages/home/heroSizes.ts'

function heroPreload(): Plugin {
  return {
    name: 'mgf-hero-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const assets = Object.values(ctx.bundle ?? {}).filter((file) => file.type === 'asset')
        const find = (name: string) => assets.find((file) => file.names?.includes(name))?.fileName
        const images = [
          { files: [['homeHeaderBg-640.webp', 640], ['homeHeaderBg-1024.webp', 1024], ['homeHeaderBg-1600.webp', 1600]], sizes: HEADER_BG_SIZES },
        ] as const
        const preloads = images.map(({ files, sizes }) => {
          const found = files.map(([name, width]) => [find(name), width] as const)
          if (found.some(([fileName]) => !fileName)) return null
          const srcset = found.map(([fileName, width]) => `/${fileName} ${width}w`).join(', ')
          return `{h:'/${found[found.length - 1][0]}',s:'${srcset}',z:'${sizes}'}`
        })
        if (preloads.includes(null)) return html
        const script = `<script>if(location.pathname==='/'){[${preloads.join(',')}].forEach(function(i){var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';l.href=i.h;l.imageSrcset=i.s;l.imageSizes=i.z;document.head.appendChild(l)})}</script>`
        return html.replace('</title>', `</title>\n    ${script}`)
      },
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), heroPreload()],
})
