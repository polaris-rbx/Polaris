const Polaris = require('../../util/client.js');
const settings = require('../../settings.json');
const specialPeople = settings.specialPeople;

class getinfoCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = 'Retrieves the Roblox information of a user.';
		this.aliases = [];
		this.group = 'Roblox';
		this.guildOnly = true;
	}
	async execute (msg, args) {
		var robloxUser;
		// Assign robloxUser to a roblox user class,using either the username given, or the user id if using a mention.
		if (msg.mentions[0]) {
			const mentionedUser = msg.mentions[1] || msg.mentions[0];
			if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**');

			let rbxId = await this.client.db.getLink(mentionedUser.id);
			if (!rbxId) {
				return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");
			}

			robloxUser = await this.client.roblox.getUser(rbxId);
		} else {
			if (args[0]) {
				robloxUser = await this.client.roblox.getUserFromName(args[0]);
			} else {
				return msg.channel.sendError(msg.author, 'You must either mention a user, or provide the username of a Roblox account.');
			}
		}
		if (robloxUser.error) {
			if (robloxUser.error.status === 404) {
				return msg.channel.sendError(msg.author, {
					title: `I couldn't find that user on Roblox.`,
					description: `I couldn't find user \`${args[0]}\` on Roblox.`
				});
			}
			msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + robloxUser.error.message + '`'});
			return this.client.logError(robloxUser.error);
		}

		var sentMsg = await msg.channel.sendInfo(msg.author, 'Getting user info... please wait.');

		if (!sentMsg) return; // No perm to send msg.
		var playerInfo = await robloxUser.getInfo();
		if (playerInfo.error) return sentMsg.edit({embed: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + playerInfo.error.message + '`', timestamp: new Date(), color: 0xb3000a}});
		const rbxId = robloxUser.id;
		var joinDate = playerInfo.joinDate;
		const date = `${(joinDate.getDate())}/${(joinDate.getMonth() + 1)}/${(joinDate.getFullYear())} (D/M/Y)`;
		var text = `**Username:** ${playerInfo.username}\n**User ID:** ${rbxId}\n**Join date**: ${date}\n**Player age:** ${playerInfo.age}\n**Player status:** "${playerInfo.status}"`;
		if (playerInfo.blurb.length <= 200) {
			text = `${text}\n**Blurb:** ${playerInfo.blurb}`;
		} else {
			text = `${text}\n**Blurb:** ${playerInfo.blurb.substring(0, 200)}**...**`;
		}
		// Exta bit for me/Polaris employees.
		if (specialPeople["" + robloxUser.id]) {
			return sentMsg.edit({embed: {
				title: 'Player info',
				description: `${text}`,
				fields: [
					{name: 'Polaris employee', value: specialPeople["" + robloxUser.id]}
				],
				url: `https://www.roblox.com/users/${rbxId}/profile`,
				thumbnail: {
					url: 'https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId=' + rbxId,
					height: 100,
					width: 100
				},
				timestamp: new Date(),
				color: 0x03b212
			}});
		}
		sentMsg.edit({embed: {
			title: 'Player info',
			description: text,
			url: `https://www.roblox.com/users/${rbxId}/profile`,
			thumbnail: {
				url: 'https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId=' + rbxId,
				height: 100,
				width: 100
			},
			timestamp: new Date(),
			color: 0x03b212
		}});

	}
}
module.exports = getinfoCommand;
