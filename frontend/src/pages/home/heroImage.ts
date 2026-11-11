import heroImageLarge from '../../assets/imgs/temporaryHeader.webp'
import heroImageSmall from '../../assets/imgs/temporaryHeader-640.webp'

export const heroImage = {
  src: heroImageLarge,
  srcSet: `${heroImageSmall} 640w, ${heroImageLarge} 1204w`,
  sizes: '(min-width: 1024px) 602px, 100vw',
}
