const good = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes"];
const none = ["Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again"];
const bad = [ "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful" ];

const BaseCommand = require("../baseCommand");

class BallCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = "A magic 8ball. Pretty simple, right?";
		this.group = "Fun";
		this.guildOnly = false;
	}
	async execute (msg) {
		var main = this.getRandomIntInclusive(1, 3);
		if (main === 1) {
			msg.channel.sendSuccess(msg.author, this.goodChoose());
		} else if (main === 2) {
			msg.channel.sendError(msg.author, this.badChoose());
		} else {
			msg.channel.sendInfo(msg.author, this.noneChoose());
		}
	}

	goodChoose () {
		let g = this.getRandomIntInclusive(0, good.length - 1);
		let text = good[g];
		return {
			title: "Magic 8ball",
			description: `:8ball: ${text} :8ball:`
		};
	}

	badChoose () {
		let g = this.getRandomIntInclusive(0, bad.length - 1);
		let text = bad[g];
		return {
			title: "Magic 8ball",
			description: `:8ball: ${text} :8ball:`
		};
	}
	noneChoose () {
		let g = this.getRandomIntInclusive(0, none.length - 1);
		let text = none[g];
		return {
			title: "Magic 8ball",
			description: `:8ball: ${text} :8ball:`
		};
	}

	getRandomIntInclusive (min, max) {
		return Math.floor(Math.random() * max) + 1;
	}
}
module.exports = BallCommand;
