export function safeLocalStorageRead<T>(
  key: string,
  validator: (val: unknown) => val is T,
  isJson = true
): T | null {
  if (typeof localStorage === 'undefined') return null;
  const data = localStorage.getItem(key);
  if (!data) return null;
  
  if (!isJson) {
    if (validator(data)) {
      return data as unknown as T;
    }
    localStorage.removeItem(key);
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    if (validator(parsed)) {
      return parsed;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
