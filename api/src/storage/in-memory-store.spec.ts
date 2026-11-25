import { InMemoryStore, cloneEntity } from './in-memory-store';

class Thing {
  constructor(
    public id: string,
    public tags: string[],
  ) {}
}

describe('InMemoryStore', () => {
  it('keeps the class when cloning', () => {
    const copy = cloneEntity(new Thing('a', ['x']));
    expect(copy).toBeInstanceOf(Thing);
    expect(copy).toEqual(new Thing('a', ['x']));
  });

  it('is not affected by mutating the object that was saved', () => {
    const store = new InMemoryStore<Thing>((t) => t.id);
    const thing = new Thing('a', ['x']);
    store.set(thing);
    thing.tags.push('y');
    expect(store.get('a')?.tags).toEqual(['x']);
  });

  it('is not affected by mutating an object it returned', () => {
    const store = new InMemoryStore<Thing>((t) => t.id);
    store.set(new Thing('a', ['x']));
    store.get('a')!.tags.push('y');
    store.values()[0].tags.push('z');
    expect(store.get('a')?.tags).toEqual(['x']);
  });

  it('returns null for a missing key and keeps insertion order', () => {
    const store = new InMemoryStore<Thing>((t) => t.id);
    store.set(new Thing('b', []));
    store.set(new Thing('a', []));
    expect(store.get('zzz')).toBeNull();
    expect(store.values().map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('replaceAll drops rows that are not in the new set', () => {
    const store = new InMemoryStore<Thing>((t) => t.id);
    store.set(new Thing('a', []));
    store.replaceAll([new Thing('b', [])]);
    expect(store.size).toBe(1);
    expect(store.get('a')).toBeNull();
  });
});
