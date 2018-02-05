//awaitMessages message collector
const EventEmitter = require("events").EventEmitter;
class MessageCollector extends EventEmitter {
	constructor(channel, filter, options = {}) {
		super();
		this.filter = filter;
		this.channel = channel;
		this.options = options;
		this.ended = false;
		this.collected = [];
		this.bot = channel.guild ? channel.guild.shard.client : channel._client;

		this.listener = message => this.verify(message);
		this.bot.on("messageCreate", this.listener);
		if(options.time) setTimeout(() => this.stop("time"), options.time);
	}

	verify(message) {
		if(this.channel.id !== message.channel.id) return false;
		if(this.filter(message)) {
			this.collected.push(message);

			this.emit("message", message);
			if(this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
			return true;
		}
		return false;
	}

	stop(reason) {
		if(this.ended) return;
		this.ended = true;
		this.bot.removeListener("messageCreate", this.listener);

		this.emit("end", this.collected, reason);
	}
}

//SEND FUNCTIONS FOR INTERACTING WITH CHANNELS.
async function sendSuccess(author, content){
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, "Success");
	embed.timestamp = new Date();
	embed.color = 0x03b212;
	try {
		await this.client.createMessage(this.id, { content:  `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
	}
}

async function sendError(author, content){
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, "Error");
	embed.timestamp = new Date();
	embed.color = 0x8b0000;
	try {
		await this.client.createMessage(this.id, { content:  `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
	}
}

async function sendInfo(author, content){
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, "Info");
	embed.timestamp = new Date();
	embed.color = 0x168776;
	try {
		await this.client.createMessage(this.id, { content:  `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
	}
}




//ASSEMBLE PROTOTYPES ONTO ERIS
module.exports = Eris => {
	Eris.Channel.prototype.awaitMessages = function(filter, options) {
		const collector = new MessageCollector(this, filter, options);
		return new Promise(resolve => collector.on("end", resolve));
	};

	Eris.Channel.prototype.sendInfo = sendInfo;
	Eris.Channel.prototype.sendError = sendError;
	Eris.Channel.prototype.sendSuccess = sendSuccess;
};




//Adds in fields that are left undefined when the send message functions are run for embeds.
function addParts(content, author, type) {


	if (typeof content === "string") {
		return {title: type, description: content, footer: {text: "Sent for: " + author.username, icon_url: author.avatarURL}, timestamp: new Date() };
	}
	if (!content.title) {
		content.title = type;
	}
	if (!content.description) {
		content.description = "Empty description";
	}
	if (!content.footer) {
		content.footer =  {text: "Sent for: " + author.username, icon_url: author.avatarURL};
	}
	return content;
}
