export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(normalized: string): string[] {
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

export function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return false;

  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) i++;
  }
  return i === needle.length;
}

export function clampNumber(number: number, max = 9999): number {
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(0, Math.floor(number)));
}
