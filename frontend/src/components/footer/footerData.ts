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
        href: 'https://wa.me/50683278347',
      },
      {
        label: 'footer.contactAddress',
        href: 'https://www.google.com/maps/search/?api=1&query=My+Green+Farm+JHGC%2BF6+Liberia+Guanacaste',
      },
    ],
  },
] as const

export const legalLink = { label: 'footer.legal.combined' } as const

export type FooterLinkKeys =
  | (typeof footerColumns)[number]['links'][number]['label']
  | (typeof legalLink)['label']

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