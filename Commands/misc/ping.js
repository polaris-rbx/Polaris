let Polaris = require("../../util/client.js");

class pingCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.description = "Simple ping command to retrieve bot latency.";
		this.aliases = ["pong"];
		this.group = "Misc";
		this.guildOnly = false;
	}
	async execute(msg) {
		//Uses default send message as otherwise edit does not work. Perhaps add edit support in future w/ embeds?
		const m = await this.client.createMessage(msg.channel.id, "Pong...");
		m.edit(`Pong! Latency is ${m.timestamp - msg.timestamp}ms.`);

	}

}
module.exports = pingCommand;
