import Redis from "ioredis";

export const LINK_CACHE = "rbxCache-";
export const REVERSE_LINK_CACHE = "revCache-";
const client = new Redis({ password: process.env.redisPassword ? process.env.redisPassword : undefined });
export async function getObject (key: string):Promise<any> {
  const raw = await client.get(key);
  if (typeof raw === "string") {
    return JSON.parse(raw);
  }
  return undefined;
}

export function setObject (key: string, value: any, ...options: any[]):Promise<any> {
  return client.set(key, JSON.stringify(value), ...options);
}

export const get = (key: string) => client.get(key);

export default client;
