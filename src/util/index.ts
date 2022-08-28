export function updateFromPartial<T>(obj: T, updates: Partial<T>):T { 
  return {...obj, ...updates} as T;
}