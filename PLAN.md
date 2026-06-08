# PLAN.md

> Committed before reading CLARIFICATIONS.md or writing any solution code.

---

## Architecture

Input: `companies.csv` (company_name + mailing_address)
Output: one enriched row per company.

```
CSV Parser
    |
    v
Normalizer        (clean company name, parse city/state)
    |
    v
Enrichment Orchestrator
    |-- Provider A: Public records / business filings
    |-- Provider B: Web/maps business listing
    |-- Provider C: Email/phone enrichment provider
    |
    v
Conflict Resolver (when providers return different contacts)
    |
    v
Confidence Scorer (weighted rules, see Quality)
    |
    v
Output Writer     (CSV, one row per input row, always)
```

Each provider is called independently and results are merged, never silently
overwritten. A row with all nulls and `needs_human_review=true` is a valid
output, not an error.

---

## Sources & strategy

Only two input signals: business name and mailing address. I'd combine three
provider types, in descending order of trust:

**Public records** (e.g. state business registries like Delaware Division of
Corporations, Wyoming Secretary of State, county business licenses): Highest
trust because it's a legal document. Each state has its own registry so coverage
depends on the company's state of registration. Some states return full owner
details, others only the registered agent name, which may not be the
decision-maker for payments. Low coverage for sole proprietors and DBAs. Rarely
has email or phone.

**Listing** (e.g. Google Business Profile, Yelp, USPS Business Address Lookup):
Medium trust, often has phone, sometimes a name. Can be stale or list a generic
staff member rather than the decision-maker.

**Enrichment** (e.g. Clearbit, Hunter.io, ZoomInfo): Algorithm-inferred
email/phone from company name. Lowest trust. Useful only when corroborated by a
higher-trust source. An enrichment-only result always goes to human review
regardless of score.

No single source gives the full picture. Public records confirm who the owner is.
Listing and enrichment supply the contact details. When the name from a listing
or enrichment matches the name from public records, that cross-source agreement
is the strongest signal the system can produce.

---

## Quality

### Confidence score (0-100, additive)

| Signal | Points |
|---|---|
| Name found in a trusted source | +40 |
| Role matches target persona (owner/CFO/AP/office mgr) | +20 |
| Email or phone present and valid format | +15 |
| Cross-source corroboration (2+ providers agree on name) | +15 |
| Location matches input address (city/state) | +10 |

Max score: 100. A weak or single-source result simply won't accumulate enough
points to clear the threshold. Below threshold (see Q1) → `needs_human_review=true`.

External enrichment providers typically return their own confidence score.
I treat it as one input signal among others, not as my final score.

### Provenance
Every output field traces back to a `source_url`. No value is written without
a traceable origin. Conflicting signals are recorded in `source_conflicts`.

### Cannot-verify output
```
# required output
contact_name: null
contact_role: null
contact_email_or_phone: null
confidence_score: 0
source: null
needs_human_review: true

# internal / provenance
source_url: null
source_conflicts: null
```
Every input row produces exactly one output row. No row is skipped.

---

## Privacy / compliance

Will do: query only public records and publicly listed contact info, store
provenance for audit, treat emails and phones as PII.

Will NOT do: scrape personal social media, use data broker lists without
CAN-SPAM/TCPA review, infer personal emails without public verification,
retain data beyond the collection purpose.

Grey area: some states (CA, VA, CO) have privacy laws that can extend to sole
proprietors. I'd confirm legal review for those states before processing.

---

## Clarifying questions

### 1. What is the confidence threshold for auto-approve vs. human review?

- **Why it matters:** this single number drives the precision/recall trade-off
  for the whole system.
- **Default assumption:** 60. I expect ~40-50% of rows to fall below it given
  the limited input signals.
- **What changes:** threshold below 50 means I accept Tier-3-only results as
  sufficient (more coverage, more noise). Above 75 means I require two-source
  corroboration for every auto-approved row (fewer contacts, higher accuracy).

---

### 2. Is there a priority order among target roles?

- **Why it matters:** if I find both an Owner and an Office Manager for the
  same company, the conflict resolver needs a deterministic rule to pick one.
- **Default assumption:** Owner > AP Manager > Office Manager > CFO. For small
  unpaid accounts, the owner has the most motivation to resolve payment quickly.
- **What changes:** if AP Manager is top priority I weight role matching
  differently. If all roles are equally valid I return the highest-confidence
  contact regardless of role, which increases coverage.

---

### 3. Should enrichment results be cached, or is the service stateless?

- **Why it matters:** if the same company gets looked up multiple times, a
  stateless service calls the providers every time. A cached service stores
  the result with a TTL and returns it without hitting providers again until
  it expires. These are different systems: one needs storage and expiration
  logic, the other doesn't.
- **Default assumption:** stateless for now. The slice processes each company
  once and returns the result. No storage layer needed, simpler to build,
  and lighter on compliance since no PII is retained beyond the request.
- **What changes:** if caching is required I need a storage layer, a TTL per
  result, and a re-enrichment trigger when the contact bounces or expires.
  The provider-call layer stays the same either way. Caching also has a
  privacy implication: storing PII (name, email, phone) beyond a single
  request requires a defined retention purpose and a maximum TTL that
  complies with CAN-SPAM/TCPA. I would not cache without confirming that
  with legal first.
