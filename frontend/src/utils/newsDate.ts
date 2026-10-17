export function formatNewsDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
  });
}
