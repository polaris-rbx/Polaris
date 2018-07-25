// ADD JSON CONVERTER TO CONVERT BINDS TO OBJECT (FROM JSON)

const r = require('rethinkdbdash')();

// DATABASE DESIGN
/*
USERS:
discordId: DISCORD ID
robloxId: Roblox ID

Servers:
Id: guildID
binds: array of binds [{role: discord role ID, rank: roblox rank ID, group: roblox group ID, exclusive: boolean}]
mainGroup: {id: ID for main group, ranksToRoles: boolean}
autoverify: false

*/
importUsers('./link.json');
importServers('./guildSetting.json');

function importUsers (where) {
	const users = require(where);

	let usersTable = r.db('main').table('users');

	Object.keys(users).forEach(k => {
		let guildData = users[k];
		let discordID = guildData.discordID;
		let robloxId = guildData.robloxID;

		usersTable.insert({
			discordId: discordID,
			robloxId: robloxId
		}).then(() => console.log(`Added user ${discordID}`)).catch(e => console.error(`Failed to add user ${discordID}} | Error: ${e}`));
	});
}
function importServers (where) {
	const servers = require(where);

	let serversTable = r.db('main').table('servers');

	Object.keys(servers).forEach(k => {
		let guildData = servers[k];
		let guildId = guildData.guildID;
		let binds = guildData.bind;
		binds = JSON.parse(binds);

		const mainGroupId = guildData.mainGroupID;
		const ranksToRoles = guildData.ranksToRoles;

		const mainGroup = {id: mainGroupId, ranksToRoles: ranksToRoles};

		serversTable.insert({
			id: guildId,
			binds: binds,
			mainGroup: mainGroup
		}).then(() => console.log(`Added server ${guildId}`)).catch(e => console.error(`Failed to add server ${guildId}} | Error: ${e}`));
	});
}
