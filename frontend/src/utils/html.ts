/**
 * @param html - rich text from the editor
 * @returns its plain text with the spaces collapsed, for example for a meta description
 */
export function htmlToText(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
  return text.replaceAll(/\s+/g, ' ').trim()
}
