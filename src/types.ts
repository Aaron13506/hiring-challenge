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

export interface OutputRow {
  company_name: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_email_or_phone: string;
  confidence_score: number;
  source: string;
  needs_human_review: boolean;
  source_url: string | null;
  source_conflicts: string | null;
}
