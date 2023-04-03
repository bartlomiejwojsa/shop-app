export function updateFromPartial<T>(obj: T, updates: Partial<T>):T { 
  return {...obj, ...updates} as T;
}

export const mongoURI =  `${process.env.MONGO_URI_PREFIX}${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}${process.env.MONGO_URI_POSTFIX}`
export const mongoSessionKey = process.env.MONGO_SESSION_KEY!