export const footerColumns = [
  {
    titleKey: 'footer.contact',
    links: [
      {
        label: 'footer.contactEmail',
        href: 'mailto:mygreenfarmcr@gmail.com',
      },
      {
        label: 'footer.contactPhone',
        href: 'tel:+50600000000',
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