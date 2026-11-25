/**
 * Deep copy that keeps the entity's class (structuredClone alone returns a
 * plain object).
 */
export function cloneEntity<T extends object>(value: T): T {
  const copy = structuredClone(value);
  Object.setPrototypeOf(copy, Object.getPrototypeOf(value) as object | null);
  return copy;
}

/**
 * Map-backed table. Everything is copied on the way in and on the way out, so
 * a caller mutating an object it holds can't silently change stored state,
 * matching how a real database behaves. Iteration follows insertion order.
 */
export class InMemoryStore<T extends object> {
  private readonly rows = new Map<string, T>();

  constructor(private readonly keyOf: (row: T) => string) {}

  get size(): number {
    return this.rows.size;
  }

  get(key: string): T | null {
    const row = this.rows.get(key);
    return row ? cloneEntity(row) : null;
  }

  set(row: T): T {
    this.rows.set(this.keyOf(row), cloneEntity(row));
    return cloneEntity(row);
  }

  values(): T[] {
    return [...this.rows.values()].map((row) => cloneEntity(row));
  }

  replaceAll(rows: T[]): void {
    this.rows.clear();
    for (const row of rows) this.set(row);
  }
}
