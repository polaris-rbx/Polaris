/*
USERS:
discordId: DISCORD ID
robloxId: ROBLOX ID

Servers:
Id: guildID
binds: array of binds [{role: discord role ID, rank: roblox rank ID, group: roblox group ID, exclusive: boolean}]
mainGroup: {id: ID for main group, ranksToRoles: boolean}
autoverify: false (boolean)
*/


"use strict";
class Database {
	constructor(client){
		this.client = client;
		this._r = require('rethinkdbdash')({db: "main"});

		this.users = this._r.table('users');
		this.servers = this._r.table('servers');

		this.defaults = {binds: [], mainGroup: {}, autoVerify: false};
		this.client.on('guildCreate', this.setupGuild.bind(this));


	}
	async getLink(discordId){
		var link = await this.users.get(discordId).run();
		if (link) {
			return link.robloxId;
		} else return;


	}

	async setupGuild(guild){
		console.log("Joined new server. Setting up Defaults.");
		try {
			let current = await this.servers.get(guild.id);
			if (!current) {
				let insertOBJ = this.defaults;
				insertOBJ.id = guild.id;
				await this.servers.insert(insertOBJ).run();
			}
		}catch (error) {
			this.client.logError(error, {ID: guild.id, type: "Database - Setup"});
		}

	}

	async getSettings(id) {
		return await this.servers.get(id).run();
	}

	async updateSetting(id, newValue) {
		var current = this.servers.get(id);
		if (!current) {
			console.log("Update guild settings but no bind? " + id);
			await this.setupGuild({id: id});
			current = this.servers.get(id);
		}


		const res = await current.update(newValue).run();
		if (res.errors !== 0) {
			this.client.logError(res.first_error, {type: "Database error. UpdateSettings." });
			return false;
		} else {
			return true;
		}

	}


}

module.exports = Database;
