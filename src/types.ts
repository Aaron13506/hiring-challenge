export interface RegistryResponse {
  name: string | null;
  role: string | null;
  source_url: string;
}

export interface ListingResponse {
  name: string | null;
  phone: string | null;
  source_url: string;
}

export interface EnrichmentResponse {
  email: string | null;
  phone: string | null;
  provider_confidence: number;
  source_url: string;
}

export interface ProviderData {
  registry?: RegistryResponse;
  listing?: ListingResponse;
  enrichment?: EnrichmentResponse;
}

export type MockDatabase = Record<string, ProviderData>;

export interface CompanyRow {
  company_name: string;
  mailing_address: string;
}

export interface ScoreSignals {
  score: number;
  nameFound: boolean;
  roleMatched: boolean;
  contactValid: boolean;
  corroborated: boolean;
}

export interface ResolvedContact {
  name: string | null;
  role: string | null;
  contact: string;
  sources: string[];
  sourceUrl: string | null;
  conflicts: string | null;
}

export interface OutputRow {
  company_name: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_email_or_phone: string;
  confidence_score: number;
  source: string;
  needs_human_review: boolean;
  suppressed: boolean;
  source_url: string | null;
  source_conflicts: string | null;
}
