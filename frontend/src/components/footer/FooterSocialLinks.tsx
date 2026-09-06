import type { IconType } from 'react-icons'
import { SiFacebook, SiInstagram, SiYoutube } from 'react-icons/si'
import { useTranslation } from 'react-i18next'

type SocialLabel =
  | 'footer.instagram'
  | 'footer.facebook'
  | 'footer.youtube'

type SocialLink = {
  label: SocialLabel
  href: string
  Icon: IconType
}

const socialLinks: SocialLink[] = [
  { label: 'footer.instagram', href: '#', Icon: SiInstagram },
  { label: 'footer.facebook', href: '#', Icon: SiFacebook },
  { label: 'footer.youtube', href: '#', Icon: SiYoutube },
]

function FooterSocialLinks() {
  const { t } = useTranslation()

  return (
    <nav
      className="flex items-center gap-md"
      aria-label={t('footer.socialLabel')}
    >
      {socialLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(label)}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </nav>
  )
}

export default FooterSocialLinks