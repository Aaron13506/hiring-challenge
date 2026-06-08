import { ProviderData, ScoreSignals } from '../types';

export const CONFIDENCE_THRESHOLD = 70;

const PERSONA_RANK: Record<string, number> = {
  'ap manager': 1,
  'accounts payable': 1,
  owner: 2,
  founder: 2,
  president: 2,
  cfo: 3,
  'office manager': 4,
};

export function classifyRole(role: string | null): number | null {
  if (!role) return null;
  const r = role.toLowerCase();
  for (const key of Object.keys(PERSONA_RANK)) {
    if (r.includes(key)) return PERSONA_RANK[key];
  }
  return null;
}

export function normalizeName(name: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(dr|mr|mrs|ms|jr|sr)\b\.?/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesAgree(a: string | null, b: string | null): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const pa = na.split(' ');
  const pb = nb.split(' ');
  if (pa[pa.length - 1] !== pb[pb.length - 1]) return false;

  // same surname: accept if first names match or one is an initial of the other
  return pa[0] === pb[0] || pa[0][0] === pb[0][0];
}

// True only when the email local-part contains the SURNAME (full, or initial+last).
// A bare first name (jeff@) is too easily derived to count as independent corroboration.
export function emailMatchesName(email: string | null, name: string | null): boolean {
  const norm = normalizeName(name);
  if (!email || !norm) return false;

  const tokens = norm.split(' ');
  if (tokens.length < 2) return false;
  const first = tokens[0];
  const last = tokens[tokens.length - 1];

  const local = email.split('@')[0].toLowerCase();
  const localTokens = local.split(/[^a-z]+/).filter((t) => t.length > 0);

  return (
    localTokens.includes(last) ||
    localTokens.includes(first + last) ||
    localTokens.includes(first[0] + last)
  );
}

function isValidEmail(email: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string | null): boolean {
  if (!phone) return false;
  return phone.replace(/\D/g, '').length >= 10;
}

export function score(data: ProviderData): ScoreSignals {
  const registryName = data.registry?.name ?? null;
  const listingName = data.listing?.name ?? null;
  const email = data.enrichment?.email ?? null;
  const phone = data.enrichment?.phone ?? data.listing?.phone ?? null;

  const nameFound = normalizeName(registryName) !== '' || normalizeName(listingName) !== '';
  const roleMatched = classifyRole(data.registry?.role ?? null) !== null;
  const contactValid = isValidEmail(email) || isValidPhone(phone);

  // 2+ independent sources agree on the identity: registry/listing names, or
  // the enrichment email surname-matching either name.
  const corroborated =
    namesAgree(registryName, listingName) ||
    emailMatchesName(email, registryName) ||
    emailMatchesName(email, listingName);

  let total = 0;
  if (nameFound) total += 40;
  if (roleMatched) total += 20;
  if (contactValid) total += 15;
  if (corroborated) total += 15;
  // +10 reserved for location match — input has no lat/lng, not awarded

  return { score: total, nameFound, roleMatched, contactValid, corroborated };
}
