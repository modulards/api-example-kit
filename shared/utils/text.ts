/** "plugin_not_found" -> "Plugin not found"; the rest keeps its case so acronyms survive. */
export function sentenceCase(value: string): string {
  const words = value.replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
