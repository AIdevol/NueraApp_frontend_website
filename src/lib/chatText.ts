/** Strip accidental HTML from assistant messages so tags are not shown as raw text. */
export function stripHtmlForChat(text: string): string {
  if (!text) return text;
  let t = text;
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/p>/gi, "\n\n");
  t = t.replace(/<\/div>/gi, "\n");
  t = t.replace(/<\/li>/gi, "\n");
  t = t.replace(/<h[1-6][^>]*>/gi, "\n");
  t = t.replace(/<\/h[1-6]>/gi, "\n\n");
  t = t.replace(/<[^>]+>/g, "");
  t = t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/** Remove **bold** wrappers and stray ** so asterisks never appear in the UI. */
export function stripMarkdownAsterisks(text: string): string {
  if (!text) return text;
  let t = text.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  t = t.replace(/\*\*/g, "");
  return t;
}

/** HTML strip + asterisk strip for assistant bubbles. */
export function formatAssistantMessage(text: string): string {
  return stripMarkdownAsterisks(stripHtmlForChat(text));
}
