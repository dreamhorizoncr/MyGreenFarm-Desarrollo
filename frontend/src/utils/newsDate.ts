/**
 * @param iso - date of the announcement
 * @param lang - language
 * @returns the day and month, for example `5 de marzo`; empty when there is no date
 */
export function formatNewsDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
  });
}
