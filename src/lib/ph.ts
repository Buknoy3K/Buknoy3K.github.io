// Wraps every [placeholder] in a highlighted span so unfinished numbers are easy to spot.
// Use with set:html. Once a value has no brackets, it renders as plain text.
export function ph(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/\[[^\]]*\]/g, (m) => `<span class="ph">${m}</span>`);
}
