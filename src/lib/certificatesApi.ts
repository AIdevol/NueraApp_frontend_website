import { getNgrokHeaders, getPublicApiUrl } from "@/lib/publicUrl";

export type CertificateStatus = "completed" | "in_progress";
export type CertificateFilter = "all" | "completed" | "in_progress";
export type CertificateSort = "newest_first" | "oldest_first" | "title_asc";

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  level: string;
  status: CertificateStatus;
  recipient_name: string;
  course_title?: string | null;
  credential_url?: string | null;
  download_url?: string | null;
  verification_code?: string | null;
  earned_at?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  progress_percent?: number | null;
  description: string;
}

export interface CertificatesListResponse {
  certifications: CertificateItem[];
  total: number;
  completed_count: number;
  in_progress_count: number;
}

export interface CertificateVerifyResponse {
  valid: boolean;
  verification_code: string;
  title?: string;
  recipient_name?: string;
  course_title?: string;
  issuer?: string;
  issued_at?: string | null;
  message: string;
}

export async function fetchCertificates(params?: {
  status?: CertificateFilter;
  sort?: CertificateSort;
}): Promise<{ data: CertificatesListResponse | null; error: string }> {
  const base = getPublicApiUrl();
  if (!base) {
    return { data: null, error: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  }

  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.sort) qs.set("sort", params.sort);
  const query = qs.toString();

  try {
    const res = await fetch(`${base}/api/v1/certifications${query ? `?${query}` : ""}`, {
      cache: "no-store",
      headers: getNgrokHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error:
          typeof (json as { detail?: string }).detail === "string"
            ? (json as { detail: string }).detail
            : "Request failed",
      };
    }
    return { data: json as CertificatesListResponse, error: "" };
  } catch {
    return { data: null, error: "Connection error." };
  }
}

export async function verifyCertificate(
  code: string
): Promise<{ data: CertificateVerifyResponse | null; error: string }> {
  const base = getPublicApiUrl();
  if (!base) {
    return { data: null, error: "API URL not configured." };
  }
  const trimmed = code.trim();
  if (!trimmed) {
    return { data: null, error: "Enter a verification code." };
  }

  try {
    const res = await fetch(
      `${base}/api/v1/certifications/verify/${encodeURIComponent(trimmed)}`,
      { cache: "no-store", headers: getNgrokHeaders() }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error:
          typeof (json as { detail?: string }).detail === "string"
            ? (json as { detail: string }).detail
            : "Verification failed",
      };
    }
    return { data: json as CertificateVerifyResponse, error: "" };
  } catch {
    return { data: null, error: "Connection error." };
  }
}
