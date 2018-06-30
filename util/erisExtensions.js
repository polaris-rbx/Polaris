// awaitMessages message collector
const EventEmitter = require('events').EventEmitter;
class MessageCollector extends EventEmitter {
	constructor (channel, filter, options = {}) {
		// wrongFun called every time an incorrect attempt is found.
		super();
		this.filter = filter;
		this.channel = channel;
		this.options = options;
		this.ended = false;
		this.collected = [];
		this.bot = channel.guild ? channel.guild.shard.client : channel._client;

		this.listener = message => this.verify(message);
		this.bot.on('messageCreate', this.listener);
		if (options.time) setTimeout(() => this.stop('time'), options.time);
	}

	verify (message) {
		if (this.channel.id !== message.channel.id) return false;
		if (this.filter(message)) {
			this.collected.push(message);

			this.emit('message', message);
			if (this.collected.length >= this.options.maxMatches) this.stop('maxMatches');
			return true;
		} else {
			this.emit('nonMatch', message);
		}
		return false;
	}

	stop (reason) {
		if (this.ended) return;
		this.ended = true;
		this.bot.removeListener('messageCreate', this.listener);

		this.emit('end', this.collected, reason);
	}
}

// SEND FUNCTIONS FOR INTERACTING WITH CHANNELS.
async function sendSuccess (author, content) {
	if (!author || !content) return console.log(`You forgot author or content! ${author} - ${content}`);
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, 'Success');
	embed.timestamp = new Date();
	embed.color = 0x23ff9f;
	try {
		return await this.client.createMessage(this.id, {content: `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
		return null;
	}
}

async function sendError (author, content) {
	if (!author || !content) return console.log(`You forgot author or content! ${author} - ${content}`);
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, 'Error');
	embed.timestamp = new Date();
	embed.color = 0xb3000a;
	try {
		return await this.client.createMessage(this.id, {content: `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
		return null;
	}
}

async function sendInfo (author, content) {
	if (!author || !content) return console.log(`You forgot author or content! ${author} - ${content}`);
	this.client = this.guild ? this.guild.shard.client : this._client;
	let embed = addParts(content, author, 'Info');
	embed.timestamp = new Date();
	embed.color = 0x168776;
	try {
		return await this.client.createMessage(this.id, {content: `<@${author.id}> `, embed: embed});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
		console.log(err);
		return null;
	}
}

async function send (content) {
	if (!content) return;
	this.client = this.guild ? this.guild.shard.client : this._client;
	try {
		return await this.client.createMessage(this.id, {content: content});
	} catch (err) {
		console.log(`Couldn't send message to ${this.id}`);
		return null;
	}
}

// ASSEMBLE PROTOTYPES ONTO ERIS
module.exports = Eris => {
	Eris.Channel.prototype.awaitMessages = function (filter, options) {
		const collector = new MessageCollector(this, filter, options);
		return new Promise(resolve => collector.on('end', resolve));
	};

	Eris.Client.prototype.MessageCollector = MessageCollector;
	// To track those currently using prompts, and stop them from starting more.
	const promptUsers = new Set();
	// Restricted prompt function. Input = Embed message or a string. Must provide author. Options is array of strings. Returns null if cancelled or timed out.
	Eris.Channel.prototype.restrictedPrompt = function (author, msgOrObj, options) {
		var channel = this;
		if (promptUsers.has(author.id)) {
			this.sendError(author, 'Please finish all other prompts before starting a new one!\nThink this is an error? Join our Discord.');
			return;
		}
		promptUsers.add(author.id);
		// Fill embed object & assemble options
		if (typeof msgOrObj === 'string')msgOrObj = {description: msgOrObj};
		var optDesc = ``;
    options.forEach(element => optDesc = `${optDesc}- ${element}\n`) // eslint-disable-line
		optDesc = `${optDesc}\nto cancel this prompt, say **cancel**.`;

		msgOrObj.title = msgOrObj.title || 'Question prompt';
		msgOrObj.fields = [{name: 'Please select one of the following options.', value: optDesc}];

		this.sendInfo(author, msgOrObj);
		// Make it so that options are capitalisation insensitive for user ease.
		options = options.join('¬').toLowerCase().split('¬');

		var fn = msg => (options.includes(msg.content.toLowerCase()) && msg.author.id === author.id) || (msg.content.toLowerCase() === 'cancel' && msg.author.id === author.id);
		const collector = new MessageCollector(this, fn, {maxMatches: 1, time: 30000});

		return new Promise(function (resolve) {
			collector.on('end', function (msg, reason) {
				if (reason === 'time') {
					channel.sendInfo(author, 'Prompt timed out');
					promptUsers.delete(author.id);
					return resolve(null);
				}

				if (msg[0].content.toLowerCase() === 'cancel') {
					channel.sendInfo(author, 'Prompt cancelled');
					promptUsers.delete(author.id);
					return resolve(null);
				}
				promptUsers.delete(author.id);
				resolve(msg[0], reason);
			});
		});
	};

	// Message prompt function. Input = Embed message or a string. Must provide author. RETURNS NULL IF TIMED OUT OR CANCELLED.
	Eris.Channel.prototype.prompt = function (author, msgOrObj) {
		var channel = this;
		if (promptUsers.has(author.id)) {
			this.sendError(author, 'Please finish all other prompts before starting a new one!\nThink this is an error? Join our Discord.');
			return;
		}
		promptUsers.add(author.id);

		if (typeof msgOrObj === 'string')msgOrObj = {description: msgOrObj};

		msgOrObj.description = `${msgOrObj.description}\nTo cancel this prompt, say **cancel**.`;

		msgOrObj.title = msgOrObj.title || 'Message Prompt';

		this.sendInfo(author, msgOrObj);

		var fn = msg => msg.author.id === author.id && !msg.content.startsWith('.');

		const collector = new MessageCollector(this, fn, {maxMatches: 1, time: 30000});
		return new Promise(function (resolve) {
			collector.on('end', function (msg, reason) {
				if (reason === 'time') {
					channel.sendInfo(author, 'Prompt timed out');
					promptUsers.delete(author.id);
					return resolve(null);
				}

				if (msg[0].content.toLowerCase() === 'cancel') {
					channel.sendInfo(author, 'Prompt cancelled');
					promptUsers.delete(author.id);
					return resolve(null);
				}
				promptUsers.delete(author.id);
				resolve(msg[0], reason);
			});
		});
	};
	async function updateNickname (settings, member, robloxId) {
		const client = this.shard.client;
		if (member.canEdit(this.members.get(client.user.id))) {
			if (settings.mainGroup.id && settings.nicknameTemplate && settings.nicknameTemplate !== '') {
				// Group is set and it nickname management is enabled
				var template = '' + settings.nicknameTemplate;
				if (template.includes('{rankName}')) {
					// Make rankName request
					const group = await client.roblox.getGroup(settings.mainGroup.id);
					if (group.error) return group; // Return error. Can be accessed with returnedValue.error

					const rank = await group.getRole(robloxId);
					if (rank.error) return rank; // Return error. Can be accessed with returnedValue.error
					// Replace
					template = template.replace(/{rankName}/g, rank);
				}

				if (template.includes('{rankId}')) {
					const group = await client.roblox.getGroup(settings.mainGroup.id);
					if (group.error) return group; // Return error. Can be accessed with returnedValue.error

					const rankId = await group.getRank(robloxId);
					if (rankId.error) return rankId; // Return error. Can be accessed with returnedValue.error
					// Replace
					template = template.replace(/{rankId}/g, rankId);
				}
				// User will be required in virtually every case. Idek why people wouldn't use it
				const user = await client.roblox.getUser(robloxId);
				if (user.error) return user;
				template = template.replace(/{robloxName}/g, user.username);
				template = template.replace(/{robloxId}/g, user.id);

				template = template.replace(/{discordName}/g, member.user.username);

				if (template.length > 32) {
					template = template.substring(0, 32);
				}

				if (member.nick !== template) {
					this.editMember(member.id, {
						nick: template
					});
					return template;
				}
			}
		}
	}
	// Editor: Member
	function canEdit (editor) {
		const guild = this.guild;

		// Check if owner
		if (this.id === guild.ownerID) {
			return false; // User owns guild. Cannot edit!
		}
		// Get target's highest role
		const targetRoles = this.roles;
		var highestTargetPos = 0;
		for (let currentRoleId of targetRoles) {
			const currentRole = guild.roles.get(currentRoleId);
			if (currentRole.position > highestTargetPos) highestTargetPos = currentRole.position;
		}
		// Get bot's highest role
		const editorRoles = editor.roles;
		var highestEditorPos = 0;
		for (let currentRoleId of editorRoles) {
			const currentRole = guild.roles.get(currentRoleId);
			if (currentRole.position > highestEditorPos) highestEditorPos = currentRole.position;
		}
		// is user below editor
		if (highestTargetPos < highestEditorPos) {
			return true;
			// Editor can edit user.
		} else {
			// Edior cannot edit user
			return false;
		}
	}

	Eris.Channel.prototype.sendInfo = sendInfo;
	Eris.Channel.prototype.sendError = sendError;
	Eris.Channel.prototype.sendSuccess = sendSuccess;
	Eris.Channel.prototype.send = send;

	Eris.Guild.prototype.updateNickname = updateNickname;
	Eris.Member.prototype.canEdit = canEdit;
};

// Adds in fields that are left undefined when the send message functions are run for embeds.
function addParts (content, author, type) {
	if (typeof content === 'string') {
		return { title: type, description: content, footer: {text: 'Sent for: ' + author.username, icon_url: author.avatarURL}, timestamp: new Date() };
	}
	if (!content.title) {
		content.title = type;
	}
	if (!content.description) {
		content.description = 'Empty description';
	}
	if (!content.footer) {
		content.footer = {text: 'Sent for: ' + author.username, icon_url: author.avatarURL};
	}
	return content;
}
