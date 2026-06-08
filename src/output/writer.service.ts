import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { stringify } from 'csv-stringify/sync';
import { OutputRow } from '../types';

const OUTPUT_DIR = join(__dirname, '..', '..', 'output');
const OUTPUT_PATH = join(OUTPUT_DIR, 'results.csv');

const COLUMNS: (keyof OutputRow)[] = [
  'company_name',
  'contact_name',
  'contact_role',
  'contact_email_or_phone',
  'confidence_score',
  'source',
  'needs_human_review',
  'source_url',
  'source_conflicts',
];

export function writeResults(rows: OutputRow[]): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const csv = stringify(rows, {
    header: true,
    columns: COLUMNS,
    cast: { boolean: (value) => (value ? 'true' : 'false') },
  });
  writeFileSync(OUTPUT_PATH, csv, 'utf-8');
  return OUTPUT_PATH;
}
