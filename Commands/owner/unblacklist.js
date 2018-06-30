let Polaris = require('../../util/client.js');

class unblacklistCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = '';
		this.aliases = [];
		this.group = 'OWNER';
		this.guildOnly = false;
		this.hidden = true;
	}
	async execute (msg, args) {
		if (msg.author.id !== this.client.ownerId) return;
		var id = args[0];
		if (msg.mentions.length !== 0) id = msg.mentions[0].id;
		if (!id) return msg.channel.sendError(msg.author, 'You must provide an ID to unblacklist!');
		const blacklist = this.client.db.blacklist;
		var blacklistRecord = await blacklist.get(id);
		if (blacklistRecord) {
			console.log(`Removing blacklist for ${id}`);
			await blacklist.get(id).delete();
			msg.channel.sendSuccess(msg.author, 'Successfully removed the blacklist!');
		} else {
			return msg.channel.sendError(msg.author, 'There is no blacklist set for that user/id!');
		}
	}
}
module.exports = unblacklistCommand;
