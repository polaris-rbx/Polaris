let Polaris = require("../../util/client.js");
const rbx = require("roblox-js");
class linkAccountCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.description = "Creates an account link to allow for role retrieval.";
		this.aliases = ["verify", "link", "relink"];
		this.group = "Roblox account verification";
	}
	async execute(msg, args) {
		//If no username, prompt for it.
		var username = args[0];
		if (!username) {
			//Prompt for username
			var rbxMsg = await msg.channel.prompt(msg.author, "You need to provide your ROBLOX username. What is your ROBLOX username?");
			if (!rbxMsg) return;
			username = rbxMsg.content;
		}

		//ROBLOX NAME VALIDATION
		if (searchForChars(username, ["?", "<", ">", "~", "|", "%", "\""])) return msg.channel.sendError(msg.author, "ROBLOX usernames may only contain letters, numbers or the _ symbol.");
		//Get ROBLOX userID from username, return error if not existing. Check that error is non-existant user error.
		let robloxId = null;
		try {
			robloxId = await rbx.getIdFromUsername(username);
		} catch (error) {
			if (error.message === "User not found" || error.message === "User does not exist" ) {
				//Say user is invalid
				msg.channel.sendError(msg.author, `The user \`${username}\` does not exist. Please check your spelling and try again.`);
				return;
			} else {
				this.client.logError(error, {CMD: "Link account", type: "getIdFromUsername"});
			}

		}
		//ALREADY EXIST CHECK
		var current = await this.client.db.users.get(msg.author.id);
		if (current) {
			var user = await rbx.getUsernameFromId(current.robloxId);

			var opt = await msg.channel.restrictedPrompt(msg.author, {title: "Continuing will overwrite", description: `Continuing will over-write your current link with user \`${user}\` and ID \`${current.robloxId}\`.\nDo you wish to continue?`}, ["Yes", "No"]);
			if (!opt) return;
			if (opt.content.toLowerCase() !== "yes") return msg.channel.sendInfo(msg.author, "Cancelled account re-linking.");
		}

		//Generate code, add to queue and return it.
		//Remove any old link attempts from queue
		if (this.client.linkQueue.get(msg.author.id))this.client.linkQueue.delete(msg.author.id);

		let code = generateCode();
		msg.channel.sendInfo(msg.author, {
			title: "Account link code",
			description: `You are linking account with account \`${username}\` with UserID \`${robloxId}\`.\nPlease place the following code in your ROBLOX profile. It can be in your ROBLOX status or description.\n**This request will time-out after five minutes**\n\`${code}\``
		});

		this.client.linkQueue.set(msg.author.id, {
			robloxId: robloxId,
			code: code,
			username: username
		});
		var linkQueue = this.client.linkQueue;
		setTimeout(function(){
			if (linkQueue.get(msg.author.id)){linkQueue.delete(msg.author.id); console.log("Timed-out");}


		}, 300000);
	}


}
module.exports = linkAccountCommand;

function searchForChars(string, chars){
	var arr = string.split("");
	for (var count in arr) {
		if (chars.includes(arr[count])) {
			return true;
		}
	}
	return false;

}

function generateCode(){
	const safeWords = [
		"weather", "hello", "roblox", "favorite", "eating", "chocolate", "cheese", "tasty", "help", "general", "know", "baby", "dolly",
		"graphics", "super", "intense", "disruption", "beautiful", "happy", "angry", "excited", "hard", "soft",
		"puppy", "dogs", "cats", "meow", "woof", "like", "enjoyable", "hamster", "tiger", "bear", "guinea", "pig", "aardvark", "sea", "lion", "chinchilla",
		"otter", "goat", "skunk", "armadillo", "oats", "beans", "tomatos", "onions", "oranges"
	];

	var words = "";

	for (var i = 0; i < 5; i++) {
		words += ` ${safeWords[Math.floor(Math.random() * safeWords.length)]}`;
	}

	words = words.slice(1);
	return words;
}
