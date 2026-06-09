# Contact Finder

Takes a CSV of small businesses (`company_name` + `mailing_address`) and finds the
right decision-maker to contact about payment. It queries three independent (and
individually fallible) mock providers, scores each result with an explainable
confidence model, resolves conflicts when providers disagree, and writes one row
per company to `output/results.csv`.

The system optimizes for **precision over recall**: a confident, traceable contact
is worth more than three guesses. When a contact cannot be verified, the row comes
back with an empty contact and `needs_human_review = true` rather than a fabricated
value. A high review rate on genuinely hard rows is the intended outcome, not a bug.

## Run it

```bash
pnpm install
pnpm start          # or: npx ts-node src/index.ts
```

Output is written to `output/results.csv` (overwritten each run). The console prints
a summary: auto-approved / needs review / suppressed.

## Data flow

```
companies.csv
    |
    v
mock.provider        lookup by company_name across registry / listing / enrichment
    |
    v
resolver.service     pick name (registry over listing), pick contact, record conflicts
    |
    v
scoring.service      additive confidence score (0-100)
    |
    v
suppression.service  drop the contact if it's on the opt-out list
    |
    v
writer.service       one row per company -> output/results.csv
```

Each provider is treated as independently fallible. A provider can return `null`
fields or be entirely absent for a company. A row with all nulls and
`needs_human_review = true` is a valid output, never an error.

## Confidence score

Additive, 0-100. The threshold for auto-approval is **70** (per CLARIFICATIONS);
below it the contact is withheld and the row is flagged for human review.

| Signal | Points |
|---|---|
| Name found in a source | +40 |
| Role matches target persona (AP / owner / CFO / office mgr) | +20 |
| Contact present and valid format (email or phone) | +15 |
| Cross-source corroboration (registry/listing names agree, or email surname-matches a name) | +15 |
| Enrichment `provider_confidence` (banded: ≥80 → +10, ≥60 → +5) | +10 |

The model is deliberately explainable: a single weak source can't accumulate enough
points to clear the threshold. `provider_confidence` is treated as one signal among
others, never as the final score.

**Persona priority** (CLARIFICATIONS): AP manager / accounts payable first, then
owner / founder, then CFO, then office manager as a fallback. In this slice the
ranking is used to *recognize* a target persona (+20 when the role matches). It is
not used to choose between several candidates, because the mock never returns more
than one person per company — there's no multi-person response to rank. If a provider
returned multiple people with roles, the same ranking would break the tie; that
selection step isn't built because the shape of a multi-candidate response isn't
defined by the mock contract.

**Email ↔ name matching** anchors on the surname. `j.smith@` or `jsmith@` corroborates
"John Smith", but a bare first name like `john@` does not — it's too easily derived to
count as independent agreement. This keeps corroboration honest and avoids false
positives.

## Output columns

| Column | Meaning |
|---|---|
| `company_name` | Input company |
| `contact_name` | Resolved decision-maker, or empty |
| `contact_role` | Their role, or empty |
| `contact_email_or_phone` | The contact value. Empty when withheld (review or opt-out) |
| `confidence_score` | 0-100, see above |
| `source` | Which mock provider(s) the result came from (`registry+enrichment`, etc.) |
| `needs_human_review` | `true` when below threshold, unverifiable, or no provenance |
| `suppressed` | `true` when the contact opted out (see Privacy) |
| `source_url` | Provenance: the `mock://` URL(s) backing the contact |
| `source_conflicts` | Recorded when providers disagree on the name |

## Design decisions

- **Cannot-verify is a first-class state.** No contact is ever emitted without at
  least one `source_url`. Below-threshold rows return empty + `needs_human_review`,
  not a guess.
- **Conflict resolution.** When registry and listing disagree on the name, registry
  wins (it's the legal record) and the disagreement is written to `source_conflicts`
  for an auditor to see, e.g. Coastal Breeze (Tina Alvarez vs Marcus Webb).
- **Opt-out / suppression.** Three terminal states exist per row: auto-approved,
  needs review, and **suppressed**. Suppression is a hard stop — even a high-confidence
  contact is withheld if it's on the Do-Not-Contact list (`data/suppression_list.json`,
  matched on company name, email, or phone). The audit trail (name, score, provenance)
  is kept so a human can see *why* the row is empty without re-surfacing the contact.

## Privacy / compliance

- US B2B only. Business contact info only, never personal/home data.
- Provenance recorded for every emitted value.
- Opt-out / suppression supported (see above).
- This challenge uses **only the mock providers** in `data/`. No real APIs are called
  and nothing is scraped.

## Known limitations

- **Nickname false positives.** Matching is intentionally conservative and does not
  map nicknames to legal names (e.g. "Bob" ↔ "Robert"), because plenty of people are
  legally named Bob. Ironclad Welding is flagged as a name conflict (registry "Robert
  Kowalski" vs listing "Bob Kowalski") even though it's likely the same person. A
  curated nickname map would fix this but risks introducing real false positives, so
  it's left out of the slice.
- **Address isn't a scoring signal.** `mailing_address` is present and carried through,
  but no provider returns a location to cross-check it against, so there's nothing to
  corroborate. Once a source did return an address or region, a match between it and
  the input could add confidence; the score weights would be rebalanced rather than
  simply extended.

## Project layout

```
data/                       input CSV, mock responses, suppression list
src/
  types.ts                  all shared interfaces
  providers/mock.provider   reads the mock database
  services/scoring          confidence model
  services/resolver         name/contact selection + conflict detection
  services/suppression      opt-out / Do-Not-Contact check
  services/enrichment       orchestrates one company -> one output row
  output/writer             CSV writer
  index.ts                  entry point: read CSV, enrich each row, write results
PLAN.md                     committed before any code (Stage A)
ABOUT.md                    about me (separate from this project writeup)
```
