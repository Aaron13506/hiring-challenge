import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const LIST_PATH = join(__dirname, '..', '..', 'data', 'suppression_list.json');

let entries: Set<string> | null = null;

function load(): Set<string> {
  if (entries === null) {
    const raw = existsSync(LIST_PATH)
      ? (JSON.parse(readFileSync(LIST_PATH, 'utf-8')) as string[])
      : [];
    entries = new Set(raw.map((e) => e.trim().toLowerCase()).filter((e) => e !== ''));
  }
  return entries;
}

// Do-Not-Contact / opt-out check (CLARIFICATIONS: "Must support opt-out /
// suppression"). An entry can be a company name, email, or phone; if any
// identifier on the row is on the list, the contact is suppressed and never
// surfaced, regardless of confidence.
export function isSuppressed(...values: (string | null)[]): boolean {
  const list = load();
  return values.some((v) => v !== null && list.has(v.trim().toLowerCase()));
}
