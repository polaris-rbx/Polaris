const BaseCommand = require('../baseCommand');

class prefixCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = 'Allows you to view or edit the prefix for this server.';
		this.group = 'Admin';
		this.guildOnly = true;
	}
	async execute (msg) {
		if (msg.member.permission.has('administrator')) {
			// user is admin
			const settings = await this.client.db.getSettings(msg.channel.guild.id);
			await this.client.commands.settings.changePrefix(msg, settings, this.client);
		} else {
			// user is not admin!
			const settings = await this.client.db.getSettings(msg.channel.guild.id);
			const prefix = settings.prefix ? settings.prefix : '.';
			await msg.channel.sendInfo(msg.author, `The prefix is currently set to ${prefix}\nYou can also mention the bot instead of using a prefix.`);
		}
	}
}
module.exports = prefixCommand;
