
    interface SeoMetadata {
    title: string
    description: string
    noIndex?: boolean
    image?: string
    type?: 'website' | 'article'
    }

    const SITE_URL = 'https://mygreenfarmcr.com'
    const SITE_NAME = 'My Green Farm'

    const PRIVATE_ROUTES = [
    '/login',
    '/signup',
    '/profile',
    '/forgot-password',
    '/reset-password',
    '/payment-success',
    '/payment-failed',
    ]

    function setMeta(
    attribute: 'name' | 'property',
    key: string,
    content: string
    ): void {
    let element = document.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`
    )

    if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
    }

    element.content = content
    }

    function absoluteURL(path: string): string {
    return new URL(path, SITE_URL).href
    }

    function setCanonical(url: string): void {
    let element = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]'
    )

    if (!element) {
        element = document.createElement('link')
        element.rel = 'canonical'
        document.head.appendChild(element)
    }

    element.href = url
    }

    export function setRouteSEO(pathname: string): void {
    const canonical = absoluteURL(pathname)

    const isPrivate =
        pathname === '/admin' ||
        pathname.startsWith('/admin/') ||
        PRIVATE_ROUTES.includes(pathname)

    setCanonical(canonical)

    setMeta(
        'name',
        'robots',
        isPrivate
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large'
    )

    setMeta('property', 'og:url', canonical)
    }

    export function setPageSEO({
    title,
    description,
    noIndex = false,
    image,
    type = 'website',
    }: SeoMetadata): void {
    const pathname = window.location.pathname

    document.title = title

    setRouteSEO(pathname)

    if (noIndex) {
        setMeta('name', 'robots', 'noindex, nofollow')
    }

    setMeta('name', 'description', description)

    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:locale', 'es_CR')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)

    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:card', 'summary_large_image')

    if (image) {
        const imageURL = absoluteURL(image)

        setMeta('property', 'og:image', imageURL)
        setMeta('name', 'twitter:image', imageURL)
    }
}
