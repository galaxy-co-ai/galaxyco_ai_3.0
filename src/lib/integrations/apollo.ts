/**
 * Apollo.io Integration Service
 *
 * Provides people and company enrichment via Apollo's API.
 * Used to enrich CRM contacts with additional data like job titles,
 * phone numbers, company information, and social profiles.
 *
 * @see https://docs.apollo.io/reference/people-enrichment
 *
 * TODO: [APOLLO PRO UPGRADE] - Once upgraded to Apollo Pro plan:
 * 1. Test API key works: node scripts/test-apollo.mjs (recreate if needed)
 * 2. Enable auto-enrichment on contact creation (see src/app/api/crm/contacts/route.ts)
 * 3. Add "Enrich" button to CRM contact UI
 * 4. Consider bulk enrichment for existing contacts
 *
 * Status: API integration READY, waiting for Pro plan (free plan = no API access)
 * Date noted: 2024-12-31
 */

import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface ApolloPersonEnrichmentRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  domain?: string;
  linkedinUrl?: string;
  revealPersonalEmails?: boolean;
  revealPhoneNumber?: boolean;
}

export interface ApolloPersonEnrichmentResponse {
  person: ApolloPerson | null;
  organization: ApolloOrganization | null;
}

export interface ApolloPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  title: string | null;
  headline: string | null;
  email: string | null;
  email_status: string | null;
  personal_emails: string[];
  phone_numbers: ApolloPhoneNumber[];
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  photo_url: string | null;
  employment_history: ApolloEmployment[];
  city: string | null;
  state: string | null;
  country: string | null;
  seniority: string | null;
  departments: string[];
}

export interface ApolloPhoneNumber {
  raw_number: string;
  sanitized_number: string;
  type: string;
  position: number;
  status: string;
}

export interface ApolloEmployment {
  organization_name: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  current: boolean;
}

export interface ApolloOrganization {
  id: string;
  name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  primary_domain: string | null;
  logo_url: string | null;
  industry: string | null;
  estimated_num_employees: number | null;
  founded_year: number | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  street_address: string | null;
  keywords: string[];
  technologies: string[];
  annual_revenue: number | null;
  annual_revenue_printed: string | null;
  total_funding: number | null;
  total_funding_printed: string | null;
}

export interface EnrichmentResult {
  success: boolean;
  person: ApolloPerson | null;
  organization: ApolloOrganization | null;
  error?: string;
  creditUsed: boolean;
}

export interface BulkEnrichmentResult {
  results: EnrichmentResult[];
  totalSuccessful: number;
  totalFailed: number;
  creditsUsed: number;
}

// ============================================================================
// APOLLO CLIENT
// ============================================================================

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

/**
 * Get the Apollo API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error("APOLLO_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Make an authenticated request to Apollo's API
 */
async function apolloRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();

  const response = await fetch(`${APOLLO_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Apollo API error", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// ENRICHMENT FUNCTIONS
// ============================================================================

/**
 * Enrich a single person by email or other identifiers
 *
 * @example
 * const result = await enrichPerson({ email: "john@company.com" });
 * console.log(result.person?.title); // "Software Engineer"
 */
export async function enrichPerson(
  params: ApolloPersonEnrichmentRequest
): Promise<EnrichmentResult> {
  try {
    // Build query params
    const queryParams = new URLSearchParams();

    if (params.email) queryParams.set("email", params.email);
    if (params.firstName) queryParams.set("first_name", params.firstName);
    if (params.lastName) queryParams.set("last_name", params.lastName);
    if (params.name) queryParams.set("name", params.name);
    if (params.domain) queryParams.set("domain", params.domain);
    if (params.linkedinUrl) queryParams.set("linkedin_url", params.linkedinUrl);

    // Request personal emails and phone numbers by default
    queryParams.set(
      "reveal_personal_emails",
      String(params.revealPersonalEmails ?? true)
    );
    queryParams.set(
      "reveal_phone_number",
      String(params.revealPhoneNumber ?? true)
    );

    const response = await apolloRequest<{
      person: ApolloPerson | null;
      organization: ApolloOrganization | null;
    }>(`/people/match?${queryParams.toString()}`, {
      method: "POST",
    });

    const hasMatch = response.person !== null;

    logger.info("Apollo enrichment completed", {
      email: params.email,
      hasMatch,
      personName: response.person?.name,
      organization: response.organization?.name,
    });

    return {
      success: hasMatch,
      person: response.person,
      organization: response.organization,
      creditUsed: true, // Apollo charges per request
    };
  } catch (error) {
    logger.error("Apollo enrichment failed", {
      params,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      person: null,
      organization: null,
      error: error instanceof Error ? error.message : "Unknown error",
      creditUsed: false,
    };
  }
}

/**
 * Enrich multiple people in bulk (up to 10 at a time)
 *
 * @example
 * const results = await enrichPeopleBulk([
 *   { email: "john@company.com" },
 *   { email: "jane@company.com" }
 * ]);
 */
export async function enrichPeopleBulk(
  requests: ApolloPersonEnrichmentRequest[]
): Promise<BulkEnrichmentResult> {
  // Apollo's bulk endpoint supports up to 10 people at a time
  const MAX_BULK_SIZE = 10;

  if (requests.length > MAX_BULK_SIZE) {
    logger.warn(
      `Bulk enrichment request exceeds max size of ${MAX_BULK_SIZE}, truncating`
    );
    requests = requests.slice(0, MAX_BULK_SIZE);
  }

  const results: EnrichmentResult[] = [];
  let totalSuccessful = 0;
  let totalFailed = 0;
  let creditsUsed = 0;

  // For now, process sequentially since bulk endpoint has specific requirements
  // TODO: Implement actual bulk endpoint when needed
  for (const request of requests) {
    const result = await enrichPerson(request);
    results.push(result);

    if (result.success) {
      totalSuccessful++;
    } else {
      totalFailed++;
    }

    if (result.creditUsed) {
      creditsUsed++;
    }
  }

  return {
    results,
    totalSuccessful,
    totalFailed,
    creditsUsed,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Apollo enrichment data to a format suitable for CRM contact updates
 */
export function mapApolloToCrmContact(result: EnrichmentResult): {
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  company?: string;
  enrichedData: Record<string, unknown>;
} | null {
  if (!result.success || !result.person) {
    return null;
  }

  const { person, organization } = result;

  // Get the best phone number (prefer mobile)
  const phoneNumber =
    person.phone_numbers?.find((p) => p.type === "mobile")?.sanitized_number ||
    person.phone_numbers?.[0]?.sanitized_number;

  return {
    firstName: person.first_name || undefined,
    lastName: person.last_name || undefined,
    title: person.title || undefined,
    phone: phoneNumber,
    linkedinUrl: person.linkedin_url || undefined,
    twitterUrl: person.twitter_url || undefined,
    company: organization?.name || undefined,
    // Store all enriched data for custom fields
    enrichedData: {
      apollo: {
        personId: person.id,
        headline: person.headline,
        photoUrl: person.photo_url,
        seniority: person.seniority,
        departments: person.departments,
        city: person.city,
        state: person.state,
        country: person.country,
        personalEmails: person.personal_emails,
        employmentHistory: person.employment_history,
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              domain: organization.primary_domain,
              industry: organization.industry,
              size: organization.estimated_num_employees,
              foundedYear: organization.founded_year,
              logoUrl: organization.logo_url,
              linkedinUrl: organization.linkedin_url,
              annualRevenue: organization.annual_revenue_printed,
              totalFunding: organization.total_funding_printed,
              technologies: organization.technologies,
            }
          : null,
        enrichedAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * Check if Apollo API key is configured
 */
export function isApolloConfigured(): boolean {
  return !!process.env.APOLLO_API_KEY;
}
