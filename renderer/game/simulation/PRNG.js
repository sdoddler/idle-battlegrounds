export function hash32(...parts) {
  const text = parts.map(String).join('|');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stream(seed, ...namespace) { return mulberry32(hash32(seed, ...namespace)); }
export function pick(rng, items) { return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]; }
export function range(rng, min, max) { return min + rng() * (max - min); }
export function int(rng, min, maxInclusive) { return Math.floor(range(rng, min, maxInclusive + 1)); }
export function chance(rng, probability) { return rng() < probability; }
export function weighted(rng, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries.at(-1)?.value;
}
