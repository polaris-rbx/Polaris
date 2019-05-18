const BaseCommand = require("../baseCommand");
class linkAccountCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = "Creates an account link to allow for role retrieval.";
		this.aliases = ["verify", "link", "relink"];
		this.group = "Roblox account verification";
	}
	async execute (msg, args, prefix) {
		// If no username, prompt for it.
		let username = args[0];
		if (username && username.toLowerCase() === "cancel") {
			const currentProcess = this.client.linkQueue.get(msg.author.id);

			if (currentProcess) {
				this.client.linkQueue.delete(msg.author.id);
				return msg.channel.sendSuccess(msg.author, `Canceled account link attempt. You can now start again with a new username!`);
			} else {
				return msg.channel.sendError(msg.author, `You don't have an account link in process! Please try again with your Roblox name.`);
			}
		}
		// Check for current link account attempt. Send message if theres one.
		if (this.client.linkQueue.get(msg.author.id)) {
			const currentProcess = this.client.linkQueue.get(msg.author.id);

			const timeElasped = Date.now() - currentProcess.time;
			let timeLeft = 600000 - timeElasped;
			// ms to s
			timeLeft = timeLeft / 1000;
			let timeMsg;
			if (timeLeft > 60) {
				var seconds = Math.floor(timeLeft % 60);
				timeMsg = `${Math.floor(timeLeft / 60)} minutes and ${seconds} seconds`;
			} else {
				timeMsg = `${seconds} seconds`;
			}
			return await msg.channel.sendInfo(msg.author, {
				title: "You are already linking your Roblox account",
				description: `You have already started linking your Roblox account!\nPlease put the code in your Roblox profile.\n**Account name**: \`${currentProcess.robloxUser.username}\`\nYou can cancel this link attempt by doing \`${prefix}link cancel\`.`,
				fields: [
					{
						name: "Code",
						value: `\`${currentProcess.code}\``
					},
					{
						name: "Time left",
						value: `You have ${timeMsg} until this request expires. You will need to start again if this happens.`
					}
				]
			}
			);
		}
		if (!username) {
			// Prompt for username
			let rbxMsg = await msg.channel.prompt(msg.author, {title: "I need your Roblox name", description: `Hey there \`${msg.author.username}\`! I need your Roblox name to get started. What is your Roblox username?`});
			if (!rbxMsg) return;
			username = rbxMsg.content;
		}



		// Roblox NAME VALIDATION
		if (searchForChars(username, ["?", "<", ">", "~", "|", "%", "\""])) return msg.channel.sendError(msg.author, "Roblox usernames may only contain letters, numbers or the _ symbol.");
		// Get Roblox userID from username, return error if not existing. Check that error is non-existant user error.
		const newUser = await this.client.roblox.getUserFromName(username);
		if (!newUser) return msg.channel.sendError(msg.author, {title: "HTTP Error", description: `I have encountered a HTTP error. Is Roblox Down?`});
		if (newUser.error || !newUser.id) {
			if (newUser.error.status === 404) return msg.channel.sendError(msg.author, {title: "User not found", description: `I could not find user \`${username}\` on Roblox.`});
			msg.channel.sendError(msg.author, {title: "HTTP Error", description: "A HTTP Error has occured. Is Roblox Down?\n`" + newUser.error.message + "`"});
			return this.client.logError(newUser.error);
		}
		// ALREADY EXIST CHECK
		let current = await this.client.db.getLink(msg.author.id);
		if (current) {
			const robloxUser = await this.client.roblox.getUser(current);
			if (!newUser.error) {
				let user = robloxUser.username;
				if (robloxUser.username === username) {
					return await msg.channel.sendError(msg.author, {
						title: "You are already linked to that account",
						description: `You are already linked to the Roblox account \`${robloxUser.username}\` and id \`${robloxUser.id}\`!\nDo \`${prefix}getroles\` to get started.`
					});
				}
				let opt = await msg.channel.restrictedPrompt(msg.author, {title: "Hold up! You have already linked your account.", description: `**PLEASE READ FULLY**\nAccount details: \`${user}\` and ID \`${current}\`.\n If this the Roblox account you want to use, just do \`${prefix}getroles\`! \nDo you want to contiue?`}, ["Yes", "No"]);
				if (!opt) return;
				if (opt.content.toLowerCase() !== "yes") return msg.channel.sendInfo(msg.author, "Cancelled account re-linking.");
			}
		}

		// Generate code, add to queue and return it.


		let code = generateCode();
		msg.channel.sendInfo(msg.author, {
			title: "Account link code - Please read FULLY",
			description: `You are linking account with account \`${username}\` with UserID \`${newUser.id}\`.\nPlease place the following code in your Roblox profile - Put it in your blurb, accessible through [settings](https://www.roblox.com/my/account).`,
			fields: [
				{name: "Code", value: `\`${code}\``},
				{name: "After you are done", value: `Once you have put the code in your profile, run the \`${prefix}done\` command! :)`},
				{name: "Timeout", value: `This request will time-out in **10 minutes.** Please run \`${prefix}done\` before then, or you'll need to restart!`}
			],
			image: {
				url: 'https://media.discordapp.net/attachments/440756186258866176/579402610268831745/yess.png'	
			}
		});

		this.client.linkQueue.set(msg.author.id, {
			robloxUser: newUser,
			code: code,
			time: Date.now()
		});
		let linkQueue = this.client.linkQueue;
		setTimeout(function () {
			if (linkQueue.get(msg.author.id)) { linkQueue.delete(msg.author.id); }
		}, 600000);
	}
}
module.exports = linkAccountCommand;

function searchForChars (string, chars) {
	let arr = string.split("");
	for (let count in arr) {
		if (chars.includes(arr[count])) {
			return true;
		}
	}
	return false;
}

function generateCode () {
	const safeWords = [
		"weather", "hello", "roblox", "favorite", "eating", "chocolate", "cheese", "tasty", "help", "general", "know", "baby", "dolly",
		"graphics", "super", "intense", "disruption", "beautiful", "happy", "angry", "excited", "hard", "soft",
		"puppy", "dogs", "cats", "meow", "woof", "like", "enjoyable", "hamster", "tiger", "bear", "guinea", "pig", "aardletk", "sea", "lion", "chinchilla",
		"otter", "goat", "skunk", "armadillo", "oats", "beans", "tomatos", "onions", "oranges"
	];

	let words = "";

	for (let i = 0; i < 5; i++) {
		words += ` ${safeWords[Math.floor(Math.random() * safeWords.length)]}`;
	}

	words = words.slice(1);
	return words;
}
