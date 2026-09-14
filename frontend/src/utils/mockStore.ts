export function createMockStore<T>(storageKey: string, seed: T[]) {
  function load(): T[] {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as T[]) : seed
    } catch {
      return seed
    }
  }

  function save(items: T[]): void {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }

  return { load, save }
}
