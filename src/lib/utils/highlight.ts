export interface TextSegment {
  text: string;
  highlight: boolean;
}

export function buildHighlightSegments(
  text: string,
  indices: readonly [number, number][]
): TextSegment[] {
  if (!indices || indices.length === 0) return [{ text, highlight: false }];

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const [start, end] of indices) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlight: false });
    }
    segments.push({ text: text.slice(start, end + 1), highlight: true });
    cursor = end + 1;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }

  return segments;
}

export function extractSnippet(body: string, maxLength = 140): string {
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength).trimEnd() + "…";
}
