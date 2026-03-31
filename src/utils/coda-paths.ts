const CODA_API_PREFIX = "/apis/v1";

export function buildApiPath(...segments: string[]): string {
  return `/${segments.map((segment) => encodeURIComponent(segment.trim())).join("/")}`;
}

export function normalizeDocId(docIdOrUrl: string): string {
  const trimmed = docIdOrUrl.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const docSegmentIndex = pathSegments.indexOf("d") + 1;
    const docSegment = pathSegments[docSegmentIndex];

    if (!docSegment) {
      return trimmed;
    }

    const match = docSegment.match(/_d([A-Za-z0-9_-]+)$/);
    if (!match) {
      return trimmed;
    }

    return match[1]!;
  } catch {
    return trimmed;
  }
}

export function apiPathFromHref(href: string): string {
  const url = new URL(href);

  if (!url.pathname.startsWith(CODA_API_PREFIX)) {
    throw new Error(`Unsupported Coda API href: ${href}`);
  }

  return `${url.pathname.slice(CODA_API_PREFIX.length)}${url.search}`;
}
