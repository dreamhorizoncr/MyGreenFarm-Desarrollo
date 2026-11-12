/**
 * Plain text of an HTML string, for meta descriptions and previews. It uses the browser parser
 * (which does not run scripts) instead of a tag regex, so long or broken markup stays linear.
 */
export function htmlToText(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.replaceAll(/\s+/g, ' ').trim()
}
