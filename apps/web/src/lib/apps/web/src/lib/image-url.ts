export function resolveImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = url.trim();

  // Already a full URL (Supabase, S3, CDN, etc)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Relative backend path
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  if (trimmed.startsWith("/")) {
    return `${apiBase}${trimmed}`;
  }

  return `${apiBase}/${trimmed}`;
}
