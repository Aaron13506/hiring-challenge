import { readFileSync } from 'fs';
import { join } from 'path';
import { MockDatabase, ProviderData } from '../types';

const DB_PATH = join(__dirname, '..', '..', 'data', 'enrichment_responses.json');

let db: MockDatabase | null = null;

function loadDatabase(): MockDatabase {
  if (db === null) {
    db = JSON.parse(readFileSync(DB_PATH, 'utf-8')) as MockDatabase;
  }
  return db;
}

export function getProviderData(companyName: string): ProviderData {
  const database = loadDatabase();
  return database[companyName] ?? {};
}
