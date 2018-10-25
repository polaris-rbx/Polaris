const { createConnection } = require('typeorm');
const entities = require('../entity/')

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
	constructor (client) {
        this.client = client;
        this.client.on('guildCreate', this.setupGuild.bind(this));
  }

  async init(options) {
    const { host, port, username, password, database, synchronize } = options
    this._connection = await createConnection({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      synchronize,
      entitySchemas: [
        ...Object.values(entities)
      ]
    })

    this.User = this._connection.getRepository('User')
    this.Server = this._connection.getRepository('Server')
    this.Group = this._connection.getRepository('Group')
    this.Blacklist = this._connection.getRepository('Blacklist')

    return this._connection
  }

	async getLink (discordId) {
		var link = await this.User.findOne(discordId);
		if (link) {
			return link.roblox_id;
		}
	}

	async setupGuild (guild) {
		console.log('Setting up Defaults.');
		try {
			let current = await this.Server.findOne(guild.id);
			if (!current) {
				const newGuild = { id: guild.id };
				await this.Server.save(newGuild);
			}
		} catch (error) {
			this.client.logError(error, {ID: guild.id, type: 'Database - Setup'});
		}
	}

	async getSettings (id) {
		const server = await this.Server.findOne(id);
		return server
	}

	async updateSetting (id, newValue) {
		let current = await this.Server.findOne(id);
		if (!current) {
            console.log('Update guild settings but no bind? ' + id);
            await this.setupGuild({id: id});
            current = await this.Server.findOne(id);
        }

        try {
		    await this.Server.update(current.id, newValue);
		    return true;
        } catch(e) {
		    this.client.logError(e, { type: 'Database error. `updateSetting`.'});
		    return false;
        }
	}
}

module.exports = Database;
