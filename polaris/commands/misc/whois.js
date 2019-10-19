const BaseCommand = require('../baseCommand');
const settings = require('../../../settings.json');
const specialPeople = settings.specialPeople;

class whoisCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = "Tells you a user's Roblox Name";
		this.aliases = ['whomst', 'who'];
		this.group = 'Roblox';
		this.guildOnly = true;
	}
	async execute (msg, args) {
		let mentionedUser;
		if (!msg.mentions[0]) {
			const user = msg.guild.members.find(member => member.username.toLowerCase().startsWith(args.join(' ')));
			if(!user) {
				return msg.channel.sendError(msg.author, "Sorry, I can't find that user in this server.");
			}
			mentionedUser = user;
		} else {
			mentionedUser = msg.mentions[0];
		}
		if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**');

		var rbxId = await this.client.db.getLink(mentionedUser.id);
		if (!rbxId) {
			return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");
		} else {
			const robloxUser = await this.client.roblox.getUser(rbxId);
			if (robloxUser.error) {
				msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + robloxUser.error.message + '`'});
				return this.client.logError(robloxUser.error);
			}
			/// Exta bit for me/Polaris employees.
			if (specialPeople["" + robloxUser.id]) {
				return msg.channel.sendInfo(msg.author, {
					title: 'Player name',
					description: `That user is \`${robloxUser.username}\`.\n\n**${specialPeople["" + robloxUser.id]}**`,
					url: `https://www.roblox.com/users/${rbxId}/profile`
				});
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
