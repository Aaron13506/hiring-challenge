import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { enrich } from './services/enrichment.service';
import { writeResults } from './output/writer.service';
import { CompanyRow, OutputRow } from './types';

const INPUT_PATH = join(__dirname, '..', 'data', 'companies.csv');

function main(): void {
  const csv = readFileSync(INPUT_PATH, 'utf-8');
  const companies = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as CompanyRow[];

  const rows: OutputRow[] = companies.map((c) => enrich(c.company_name));

  const outputPath = writeResults(rows);

  const suppressed = rows.filter((r) => r.suppressed).length;
  const needsReview = rows.filter((r) => r.needs_human_review).length;
  const autoApproved = rows.length - needsReview - suppressed;

  console.log(`Wrote ${rows.length} rows to ${outputPath}`);
  console.log(`  auto-approved:      ${autoApproved}`);
  console.log(`  needs human review: ${needsReview}`);
  console.log(`  suppressed (opt-out): ${suppressed}`);
}

main();
