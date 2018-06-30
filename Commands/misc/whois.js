let Polaris = require('../../util/client.js');

class whoisCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = "Tells you a user's ROBLOX Name";
		this.aliases = ['whomst', 'who'];
		this.group = 'Roblox';
		this.guildOnly = true;
	}
	async execute (msg) {
		if (!msg.mentions[0]) {
			return msg.channel.sendError(msg.author, 'You must mention a user.\nSupport for whois without tagging will be added in future.');
		}
		const mentionedUser = msg.mentions[0];
		if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**');

		var rbxId = await this.client.db.getLink(mentionedUser.id);
		if (!rbxId) {
			return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");
		} else {
			const robloxUser = await this.client.roblox.getUser(rbxId);
			if (robloxUser.error) {
				msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + robloxUser.error.message + '`'});
				return this.client.logError(robloxUser.error);
			}

			msg.channel.sendInfo(msg.author, {
				title: 'Player name',
				description: `That user is \`${robloxUser.username}\`.`,
				url: `https://www.roblox.com/users/${rbxId}/profile`
			});
		}
	}
}
module.exports = whoisCommand;
