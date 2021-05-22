const fetch = require("node-fetch");

export async function makeRequest (url: string, options: any) {
  const req = await fetch(url, options);
  return req.json();
}
export const get = makeRequest;
