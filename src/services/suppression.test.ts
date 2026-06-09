import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSuppressed } from './suppression.service';

test('an email on the opt-out list is suppressed', () => {
  assert.equal(isSuppressed('karen@bayviewauto.com'), true);
});

test('matching is case-insensitive', () => {
  assert.equal(isSuppressed('KAREN@BayviewAuto.com'), true);
});

test('a contact not on the list is not suppressed', () => {
  assert.equal(isSuppressed('nobody@nowhere.com'), false);
  assert.equal(isSuppressed(null, 'Bayview Auto Repair'), false);
});
