let Polaris = require("../../util/client.js");

class linkAccountCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.description = "Creates an account link to allow for role retrieval.";
		this.aliases = ["verify", "link"];
		this.group = "Roblox account verification";
	}
	async execute(msg, args) {
		//If no username, prompt for it.
		//If there is an existing link 
		//
		//

	}

}
module.exports = linkAccountCommand;
