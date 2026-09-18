export const NOTE_MAX_LENGTH = 1000;

const TAG_PATTERN = /<[^>]*>/g;

/** Counted like the API counts it. @see https://api.docs.modulards.com/modular-ds-public-api/sites/update-site-note */
export function noteLength(note: string): number {
  return new TextEncoder().encode(note.replace(TAG_PATTERN, '')).length;
}
