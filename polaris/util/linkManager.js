const fetch = require("node-fetch");

const cache = new Map();
const { aquariusKey, aquariusUrl = "https://verify.nezto.re" } = require("../../settings.json");

async function getLink (discordId) {
  if (cache.has(discordId)) {
    const c = cache.get(discordId);
    // 15 second per user
    if (Date.now() - c.setAt < 15000) {
      return c.robloxId;
    }
  }
  try {
    const json = await makeRequest(`/api/roblox/${discordId}`);
    cache.set(discordId, {
      setAt: Date.now(),
      robloxId: json.robloxId
    });
    return json.robloxId;
  } catch (e) {
    return undefined;
  }
}
/*
    The following functions are 'internal'. Or rather, they make use of the internal Aquarius API.
    They do not work if the correct authentication key is not supplied. The open source version of Polaris does not
    have this authentication key - Polaris will automatically direct users to use the web version instead.
 */

async function getCode (discordId, robloxId) {
  try {
    const json = await makeRequest(`/verification/code/${discordId}/${robloxId}`);
    if (json.code && json.robloxId === robloxId) {
      return json.code;
    } if (json.error) {
      console.log(json.error.message);
    }
    console.log(json);
    throw new Error("Failed id validation");
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

async function checkCode (discordId) {
  try {
    const json = await makeRequest(`/verification/check`, {
      body: { discordId },
      method: "POST"
    });
    if (json.success && json.discordId === discordId) {
      return {
        success: true,
        updated: json.updated
      };
    } if (json.error) {
      console.log(json.error);
      return json;
    }
    throw new Error("Failed id validation");
  } catch (e) {
    return undefined;
  }
}
// Clear once every 10 minutes to prevent leaks
setTimeout(() => {
  cache.clear();
}, 600000);

async function makeRequest (url, options = {}) {
  if (!options.headers) options.headers = {};

  if (aquariusKey) {
    options.headers.Authorization = aquariusKey;
  }

  if (options.body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const req = await fetch(`${aquariusUrl}${url}`, options);
  return req.json();
}

module.exports = {
  getLink,
  getCode,
  checkCode
};
