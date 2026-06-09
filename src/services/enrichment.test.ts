import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrich } from './enrichment.service';

// End-to-end over the real fixtures: proves the pieces (resolve + score +
// suppression) wire together into the right terminal state per row.

test('happy path: a corroborated company is auto-approved with a contact', () => {
  const out = enrich('Cedar Ridge Plumbing LLC');
  assert.equal(out.needs_human_review, false);
  assert.equal(out.suppressed, false);
  assert.equal(out.contact_name, 'Daniel Ortega');
  assert.notEqual(out.contact_email_or_phone, '');
});

test('opt-out: a suppressed company never surfaces a contact', () => {
  const out = enrich('Bayview Auto Repair');
  assert.equal(out.suppressed, true);
  assert.equal(out.needs_human_review, false);
  assert.equal(out.contact_email_or_phone, '');
});

test('cannot-verify: a company with no sources goes to human review, empty', () => {
  const out = enrich('Redwood Cabinetry');
  assert.equal(out.needs_human_review, true);
  assert.equal(out.suppressed, false);
  assert.equal(out.contact_email_or_phone, '');
});
