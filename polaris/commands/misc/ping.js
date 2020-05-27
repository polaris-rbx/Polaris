const BaseCommand = require('../baseCommand');

class pingCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = 'Simple ping command to retrieve bot latency.';
		this.aliases = ['pong'];
		this.group = 'Misc';
		this.guildOnly = false;
	}
	async execute (msg) {
		const m = await msg.channel.send('Pong...');
		if (!m) return; // no perm
		m.edit(`Pong! Latency is ${m.timestamp - msg.timestamp}ms.`);
	}
}
module.exports = pingCommand;
