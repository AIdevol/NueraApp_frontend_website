/** Initials from full name for avatar fallback (e.g. "Jane Doe" → "JD"). */
export function initialsFromFullName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
