import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from './resolver.service';
import { ProviderData } from '../types';

test('name comes from registry over listing, with the registry role', () => {
  const data: ProviderData = {
    registry: { name: 'Daniel Ortega', role: 'Owner', source_url: 'mock://r' },
    listing: { name: 'Danny O', phone: null, source_url: 'mock://l' },
  };
  const out = resolve(data);
  assert.equal(out.name, 'Daniel Ortega');
  assert.equal(out.role, 'Owner');
});

test('contact priority is enrichment email, then enrichment phone, then listing phone', () => {
  const email: ProviderData = {
    enrichment: { email: 'a@x.com', phone: '111', provider_confidence: 50, source_url: 'mock://e' },
    listing: { name: null, phone: '222', source_url: 'mock://l' },
  };
  assert.equal(resolve(email).contact, 'a@x.com');

  const enrichmentPhone: ProviderData = {
    enrichment: { email: null, phone: '111', provider_confidence: 50, source_url: 'mock://e' },
    listing: { name: null, phone: '222', source_url: 'mock://l' },
  };
  assert.equal(resolve(enrichmentPhone).contact, '111');

  const listingPhone: ProviderData = {
    listing: { name: null, phone: '222', source_url: 'mock://l' },
  };
  assert.equal(resolve(listingPhone).contact, '222');
});

test('disagreeing names are recorded as a conflict and registry is kept', () => {
  const data: ProviderData = {
    registry: { name: 'Tina Alvarez', role: 'Manager', source_url: 'mock://r' },
    listing: { name: 'Marcus Webb', phone: null, source_url: 'mock://l' },
  };
  const out = resolve(data);
  assert.equal(out.name, 'Tina Alvarez');
  assert.match(out.conflicts ?? '', /kept registry/);
});

test('agreeing names produce no conflict', () => {
  const data: ProviderData = {
    registry: { name: 'John Smith', role: 'Owner', source_url: 'mock://r' },
    listing: { name: 'J. Smith', phone: null, source_url: 'mock://l' },
  };
  assert.equal(resolve(data).conflicts, null);
});

test('provenance is deduped and a no-source company resolves to cannot-verify', () => {
  const dupe: ProviderData = {
    registry: { name: 'Jane Doe', role: 'Owner', source_url: 'mock://same' },
    enrichment: { email: 'jane@x.com', phone: null, provider_confidence: 90, source_url: 'mock://same' },
  };
  assert.equal(resolve(dupe).sourceUrl, 'mock://same');

  const empty = resolve({});
  assert.equal(empty.name, null);
  assert.equal(empty.contact, '');
  assert.equal(empty.sourceUrl, null);
  assert.deepEqual(empty.sources, []);
});
