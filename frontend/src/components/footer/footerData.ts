export const footerColumns = [
  {
    titleKey: 'footer.contact',
    links: [
      {
        label: 'footer.contactEmail',
        href: 'https://mail.google.com/mail/?view=cm&fs=1&to=mygreenfarmcr@gmail.com',
      },
      {
        label: 'footer.contactPhone',
        href: 'tel:+506 8327 8347',
      },
      { label: 'footer.contactAddress' },
    ],
  },
] as const

export const legalLinks = [
  { label: 'footer.legal.terms', to: '/terms' },
  { label: 'footer.legal.privacy', to: '/privacy' },
] as const

export type FooterLinkKeys =
  | (typeof footerColumns)[number]['links'][number]['label']
  | (typeof legalLinks)[number]['label']

export type FooterTitleKeys = (typeof footerColumns)[number]['titleKey']

export interface FooterLink {
  label: FooterLinkKeys
  to?: string
  href?: string
}

export interface FooterColumnData {
  titleKey: FooterTitleKeys
  links: readonly FooterLink[]
}