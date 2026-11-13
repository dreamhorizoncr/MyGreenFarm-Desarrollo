export function htmlToText(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.replaceAll(/\s+/g, ' ').trim()
}
