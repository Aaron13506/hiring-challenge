import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRole,
  namesAgree,
  emailMatchesName,
  score,
  CONFIDENCE_THRESHOLD,
} from './scoring.service';
import { ProviderData } from '../types';

test('classifyRole recognizes target personas and rejects the rest', () => {
  assert.equal(classifyRole('AP Manager'), 1);
  assert.equal(classifyRole('Owner'), 2);
  assert.equal(classifyRole('Registered Agent'), null);
  assert.equal(classifyRole(null), null);
});

test('namesAgree accepts an initial but keeps Bob and Robert apart', () => {
  assert.equal(namesAgree('John Smith', 'J. Smith'), true);
  assert.equal(namesAgree('Dr. Emily Hart', 'Emily Hart'), true);
  assert.equal(namesAgree('Robert Kowalski', 'Bob Kowalski'), false);
  assert.equal(namesAgree('Tina Alvarez', 'Marcus Webb'), false);
});

test('emailMatchesName anchors on the surname, not a bare first name', () => {
  assert.equal(emailMatchesName('j.smith@x.com', 'John Smith'), true);
  assert.equal(emailMatchesName('jsmith@x.com', 'John Smith'), true);
  assert.equal(emailMatchesName('smith@x.com', 'John Smith'), true);
  assert.equal(emailMatchesName('john@x.com', 'John Smith'), false);
  assert.equal(emailMatchesName('j.smith@x.com', 'Smith'), false);
});

test('a corroborated high-confidence contact clears the threshold', () => {
  const data: ProviderData = {
    registry: { name: 'Daniel Ortega', role: 'Owner', source_url: 'mock://r' },
    enrichment: {
      email: 'd.ortega@cedarridge.com',
      phone: null,
      provider_confidence: 82,
      source_url: 'mock://e',
    },
  };
  assert.ok(score(data).score >= CONFIDENCE_THRESHOLD);
});

test('a single weak enrichment guess stays below the threshold', () => {
  const data: ProviderData = {
    enrichment: {
      email: 'guess@x.com',
      phone: null,
      provider_confidence: 30,
      source_url: 'mock://e',
    },
  };
  assert.ok(score(data).score < CONFIDENCE_THRESHOLD);
});
