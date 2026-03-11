export function resolveImageUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = url.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  if (trimmed.startsWith("/")) {
    return `${apiBase}${trimmed}`;
  }

  return `${apiBase}/${trimmed}`;
}
