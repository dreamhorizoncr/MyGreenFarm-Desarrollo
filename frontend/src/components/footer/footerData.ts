/** Columns of links of the footer; the labels are translation keys. */
export const footerColumns = [
  {
    titleKey: 'footer.contact',
    links: [
      {
        label: 'footer.contactEmail',
        href: 'https://mail.google.com/mail/?view=cm&fs=1&to=monicapr@mygreenfarmcr.com',
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

/** Link that opens the legal terms. */
export const legalLink = { label: 'footer.legal.combined' } as const

/** Translation keys of the footer's links. */
export type FooterLinkKeys =
  | (typeof footerColumns)[number]['links'][number]['label']
  | (typeof legalLink)['label']

/** Translation keys of the titles of the footer's columns. */
export type FooterTitleKeys = (typeof footerColumns)[number]['titleKey']

/** A link of the footer: to a page of the site (`to`) or to an outside URL (`href`). */
export interface FooterLink {
  label: FooterLinkKeys
  to?: string
  href?: string
}

/** A column of links of the footer. */
export interface FooterColumnData {
  titleKey: FooterTitleKeys
  links: readonly FooterLink[]
}