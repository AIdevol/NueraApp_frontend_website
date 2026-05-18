import { getNgrokHeaders } from "@/lib/publicUrl";

/** Headers for authenticated API calls (JWT from login). */

export function bearerAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return getNgrokHeaders();
  const token = localStorage.getItem("token");
  return {
    ...getNgrokHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
