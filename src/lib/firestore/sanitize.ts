/** Firestore rechaza valores `undefined`; omite esas claves (objetos planos, un nivel). */
export function forFirestore<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const nested = forFirestore(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[key] = nested;
      continue;
    }
    out[key] = value;
  }
  return out;
}
