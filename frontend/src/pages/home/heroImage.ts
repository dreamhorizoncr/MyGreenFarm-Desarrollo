import heroImageLarge from '../../assets/imgs/temporaryHeader.webp'
import heroImageMedium from '../../assets/imgs/temporaryHeader-960.webp'
import heroImageSmall from '../../assets/imgs/temporaryHeader-640.webp'
import { HERO_SIZES } from './heroSizes.ts'

export const heroImage = {
  src: heroImageLarge,
  srcSet: `${heroImageSmall} 640w, ${heroImageMedium} 960w, ${heroImageLarge} 1204w`,
  sizes: HERO_SIZES,
}
