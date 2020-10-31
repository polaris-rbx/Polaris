const request = require("./polaris-rbx/request");
const cache = new Map();

async function getLink (discordId) {
    if (cache.has(discordId)) {
        const c = cache.get(discordId);
        // 15 second per user
        if (Date.now() - c.setAt < 15000) {
            return c.robloxId;
        }
    }
    try {
        const resp = await request(`https://verify.nezto.re/api/roblox/${discordId}`);
        const json = await resp.json();
        cache.set(discordId, {
            setAt: Date.now(),
            robloxId: json.robloxId
        });
        return json.robloxId;
    } catch (e) {
        return undefined;
    }
}
// Clear once every 10 minutes to prevent leaks
setTimeout(function () {
    cache.clear();
}, 600000)

module.exports = {
    getLink
}