import { OutputRow } from '../types';
import { getProviderData } from '../providers/mock.provider';
import { resolve } from './resolver.service';
import { score, CONFIDENCE_THRESHOLD } from './scoring.service';

export function enrich(companyName: string): OutputRow {
  const data = getProviderData(companyName);
  const resolved = resolve(data);
  const signals = score(data);

  // Below threshold, or no reachable contact / no provenance → human review,
  // and never ship a contact value we can't stand behind.
  const needsReview =
    signals.score < CONFIDENCE_THRESHOLD || resolved.contact === '' || resolved.sourceUrl === null;

  return {
    company_name: companyName,
    contact_name: resolved.name,
    contact_role: resolved.role,
    contact_email_or_phone: needsReview ? '' : resolved.contact,
    confidence_score: signals.score,
    source: resolved.sources.join('+'),
    needs_human_review: needsReview,
    source_url: resolved.sourceUrl,
    source_conflicts: resolved.conflicts,
  };
}
