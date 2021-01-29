const fetch = require("node-fetch");

module.exports = async function request (url, opt) {
  const resp = await fetch(url, opt);
  if (resp.ok) {
    return resp;
  }
  const text = await resp.text();
  throw new Error(text);
};
