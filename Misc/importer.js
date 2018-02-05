//ADD JSON CONVERTER TO CONVERT BINDS TO OBJECT (FROM JSON)


const r = require('rethinkdbdash')();


const users = require('./link.json');

let usersTable = r.db('main').table('users');

Object.keys(users).forEach(k => {
	let guildData = users[k];
	let discordID = guildData.discordID;


	usersTable.insert({
		id: discordID,
		robloxId: guildData.robloxID
	}).then(() => console.log(`Added guild ${discordID}`)).catch(e => console.error(`Failed to add user ${discordID}} | Error: ${e}`));
});
