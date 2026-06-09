import { OutputRow } from '../types';
import { getProviderData } from '../providers/mock.provider';
import { resolve } from './resolver.service';
import { score, CONFIDENCE_THRESHOLD } from './scoring.service';
import { isSuppressed } from './suppression.service';

export function enrich(companyName: string): OutputRow {
  const data = getProviderData(companyName);
  const resolved = resolve(data);
  const signals = score(data);

  // Opt-out is a hard stop and its own terminal state: we may have found a
  // confident contact, but if they're on the Do-Not-Contact list we never
  // surface it. Checked before review so it can't be auto-approved.
  const suppressed = isSuppressed(companyName, resolved.name, resolved.contact);

  // Below threshold, or no reachable contact / no provenance → human review,
  // and never ship a contact value we can't stand behind.
  const needsReview =
    !suppressed &&
    (signals.score < CONFIDENCE_THRESHOLD ||
      resolved.contact === '' ||
      resolved.sourceUrl === null);

  return {
    company_name: companyName,
    contact_name: resolved.name,
    contact_role: resolved.role,
    contact_email_or_phone: suppressed || needsReview ? '' : resolved.contact,
    confidence_score: signals.score,
    source: resolved.sources.join('+'),
    needs_human_review: needsReview,
    suppressed,
    source_url: resolved.sourceUrl,
    source_conflicts: resolved.conflicts,
  };
}
