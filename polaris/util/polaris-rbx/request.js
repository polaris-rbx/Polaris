const fetch = require("node-fetch");
module.exports = async function request(url) {
    const resp = await fetch(url);
    if (resp.ok) {
        return resp;
    } else {
        throw new Error(resp);
    }

}
