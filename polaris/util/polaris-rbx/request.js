const fetch = require("node-fetch");
module.exports = async function request(url) {
    const resp = await fetch(url);
    if (resp.ok) {
        return resp;
    } else {
        return resp; //For for error handling
        throw new Error(resp);
    }

}
