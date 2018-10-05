'use strict';
let Polaris = require('../../util/client.js');

class updateRoleCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = "Uses a previously linked account and a server's settings to a user their roles according to your group rank(s).";
		this.aliases = ['updateRole', 'updateRoles'];
		this.group = 'Roblox account verification';
		this.permissions = ['manageRoles'];
		this.guildOnly = true;
	}
	async execute (msg) {
		// Check for link
		if (!msg.mentions[0]) {
			return msg.channel.sendError(msg.author, 'You must mention a user.\nSupport for updateroles without tagging will be added in future.');
		}
		const mentionedUser = msg.mentions[0];
		const mentionedMember = msg.channel.guild.members.get(mentionedUser.id);
		if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**');

		var rbxId = await this.client.db.getLink(mentionedUser.id);
		if (!rbxId) {
			const res = await this.client.commands.getrole.verifiedRoles(false, mentionedMember);
			if (res.error) {
				return msg.channel.sendError(msg.author, {title: 'No permissions', description: res.error});
			}
			return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");
		}
		const pendingMsg = await msg.channel.send("Fetching their info...");
		const response = await this.client.commands.getrole.giveRoles(mentionedMember, rbxId);

		if (response.error) {
			response.error.color = 0xb3000a;
			pendingMsg.edit({
				content: `<@${msg.author.id}>`,
				embed: response.error
			});
		} else {
			response.color = response.color||0x23ff9f;
			response.title = "Changed their roles:";
			pendingMsg.edit({
				content: `<@${msg.author.id}>`,
				embed: response
			});
		}
	}
}
module.exports = updateRoleCommand;
