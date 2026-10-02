// Best-effort, per-instance throttle for public endpoints.
// Use a shared store (Redis, Upstash, ...) when running more than one instance.
const buckets = new Map<string, number[]>();

export function isThrottled(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return hits.length > max;
}
