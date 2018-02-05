"use strict";
class Database {
	constructor(client){
		this.client = client;
		this._r = require('rethinkdbdash')({db: "main"});

		this.users = this._r.table('users');
		this.servers = this._r.table('servers');

		this.defaults = {binds: [], };
		this.client.on('guildCreate', this.setupGuild.bind(this));


	}
	async setupGuild(guild){
		try {
			let current = await this.servers.get(guild.id);
			if (!current) {
				let insertOBJ = this.defaults;
				insertOBJ.id = guild.id;
				await this.servers.insert(insertOBJ);
			}
		}catch (error) {
			this.client.logError(error, {ID: guild.id, type: "Database - Setup"});
		}

	}


}

module.exports = Database;
