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

class Database {
  constructor (client) {
    this.client = client;
    this._r = require("rethinkdbdash")({ db: "main" });

    this.servers = this._r.table("servers");
    this.blacklist = this._r.table("blacklist");

    this.defaults = {
      binds: [],
      mainGroup: {},
      autoVerify: false
    };
    this.client.on("guildCreate", this.setupGuild.bind(this));
  }

  async setupGuild (guild) {
    console.log("Setting up Defaults.");
    try {
      const current = await this.servers.get(guild.id);
      if (!current) {
        const insertOBJ = this.defaults;
        insertOBJ.id = guild.id;
        await this.servers.insert(insertOBJ).run();
      }
    } catch (error) {
      this.client.logError(error, {
        ID: guild.id,
        type: "Database - Setup"
      });
    }
  }

  async getSettings (id) {
    return this.servers.get(id).run();
  }

  async updateSetting (id, newValue) {
    let current = this.servers.get(id);
    if (!current) {
      console.log(`Update guild settings but no bind? ${id}`);
      await this.setupGuild({ id });
      current = this.servers.get(id);
    }

    const res = await current.update(newValue).run();
    if (res.errors !== 0) {
      this.client.logError(res.first_error, { type: "Database error. UpdateSettings." });
      return false;
    }
    return true;
  }
}

module.exports = Database;
