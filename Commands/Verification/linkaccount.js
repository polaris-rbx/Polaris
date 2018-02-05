let Polaris = require("../../util/client.js");

class linkAccountCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.description = "Simple ping command to retrieve bot latency.";
		this.aliases = ["verify", "link"];
		this.group = "Roblox account verification";
	}
	async execute(msg) {
		console.log("A");

	}

}
module.exports = linkAccountCommand;
