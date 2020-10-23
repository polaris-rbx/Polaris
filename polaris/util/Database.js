/*
USERS:
discordId: DISCORD ID
robloxId: Roblox ID

Servers:
Id: guildID
binds: array of binds [{role: discord role ID, rank: roblox rank ID, group: roblox group ID, exclusive: boolean}]
mainGroup: {id: ID for main group, ranksToRoles: boolean}
autoverify: false (boolean)
*/

'use strict';
class Database {
	const fetch = require("node-fetch");
	// Variables
	let noMade = 0;
	let cache = {};
	let disabled = false;
	let since = Date.now();
	// Clear your cache
	setInterval(function () {
		cache = {}
	}, 300000)
	
	constructor (client) {
		this.client = client;
		this._r = require('rethinkdbdash')({db: 'main'});

		this.users = this._r.table('users');
		this.servers = this._r.table('servers');
		this.blacklist = this._r.table('blacklist');

		this.defaults = {binds: [], mainGroup: {}, autoVerify: false};
		this.client.on('guildCreate', this.setupGuild.bind(this));
	}
	async getLink (discordId) {
		var link = await this.users.get(discordId).run();
		if (link) {
			return link.robloxId;
		}

		
		
		if (noMade >= 59 && (Date.now() - since) < 60000) {
			// If more than 60 made and within 60 seconds -- too fast
			console.log("Local ratelimit hit!")
			return false;
		} else if ( (Date.now() - since) > 60000) {
			noMade = 0
			since = Date.now()
		}
		noMade++
		const prom = await fetch(`https://verify.nezto.re/api/roblox/${discordId}`);
		const res = await prom.json();
		if (res.error) {
				if (res.error.status === 429) {
					// Handle rate limit error
					console.error(`Hit ratelimit!`);
					disabled = true
					setTimeout(function () {
					disabled = false
				}, (res.error.retryAfter + 2))
			}
		} else {
			return res.robloxId;
		}
	}

	async setupGuild (guild) {
		console.log('Setting up Defaults.');
		try {
			let current = await this.servers.get(guild.id);
			if (!current) {
				let insertOBJ = this.defaults;
				insertOBJ.id = guild.id;
				await this.servers.insert(insertOBJ).run();
			}
		} catch (error) {
			this.client.logError(error, {ID: guild.id, type: 'Database - Setup'});
		}
	}

	async getSettings (id) {
		return this.servers.get(id).run();
	}

	async updateSetting (id, newValue) {
		var current = this.servers.get(id);
		if (!current) {
			console.log('Update guild settings but no bind? ' + id);
			await this.setupGuild({id: id});
			current = this.servers.get(id);
		}

		const res = await current.update(newValue).run();
		if (res.errors !== 0) {
			this.client.logError(res.first_error, { type: 'Database error. UpdateSettings.' });
			return false;
		} else {
			return true;
		}
	}
}

module.exports = Database;
