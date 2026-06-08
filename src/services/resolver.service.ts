import { ProviderData, ResolvedContact } from '../types';
import { namesAgree } from './scoring.service';

// Name comes from the highest-trust source available: registry over listing.
function pickName(data: ProviderData): { value: string; url: string } | null {
  if (data.registry?.name) return { value: data.registry.name, url: data.registry.source_url };
  if (data.listing?.name) return { value: data.listing.name, url: data.listing.source_url };
  return null;
}

// Contact value: email is most actionable, then enrichment phone, then listing phone.
function pickContact(data: ProviderData): { value: string; url: string } | null {
  const e = data.enrichment;
  if (e?.email) return { value: e.email, url: e.source_url };
  if (e?.phone) return { value: e.phone, url: e.source_url };
  if (data.listing?.phone) return { value: data.listing.phone, url: data.listing.source_url };
  return null;
}

export function resolve(data: ProviderData): ResolvedContact {
  const registryName = data.registry?.name ?? null;
  const listingName = data.listing?.name ?? null;

  let conflicts: string | null = null;
  if (registryName && listingName && !namesAgree(registryName, listingName)) {
    conflicts = `name: registry="${registryName}" vs listing="${listingName}" (kept registry)`;
  }

  const namePick = pickName(data);
  const contactPick = pickContact(data);

  const sources: string[] = [];
  if (data.registry) sources.push('registry');
  if (data.listing) sources.push('listing');
  if (data.enrichment) sources.push('enrichment');

  // Provenance for every emitted value; deduped. Guarantees a contact never
  // ships without at least one source_url.
  const urls = [namePick?.url, contactPick?.url].filter((u): u is string => typeof u === 'string');
  const sourceUrl = urls.length > 0 ? Array.from(new Set(urls)).join('; ') : null;

  return {
    name: namePick?.value ?? null,
    role: data.registry?.role ?? null,
    contact: contactPick?.value ?? '',
    sources,
    sourceUrl,
    conflicts,
  };
}
