let Polaris = require("../../util/client.js");
const rbx = require("roblox-js");
class linkAccountCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.description = "Creates an account link to allow for role retrieval.";
		this.aliases = ["verify", "link"];
		this.group = "Roblox account verification";
	}
	async execute(msg, args) {
		//If no username, prompt for it.
		var username = args[0];
		if (!username) {
			//Prompt for username
		}
		var current = this.client.db.users.get(msg.author.id);
		if (current) {
			//Either warn them that they already have a link or tell them to do .unlink
		}
		
		//Get ROBLOX userID from username, return error if not existing. Check that error is non-existant user error.
		try {
		await rbx.getIdFromUsername();
		} catch (error) {
			if (error.message === "ErrorNameForUserNotFOund") {
				//Say user is invalud
			} else {
				//Return that error to the user & sentry?
			}
			
		}
		//Generate code, add to queue and return it.
		

	}
	generate

}
module.exports = linkAccountCommand;
