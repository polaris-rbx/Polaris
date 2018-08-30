// Require dependencies
var Eris = require('eris');
var erisExtensions = require('./erisExtensions.js');

var DB = require('./db.js');
const Collection = require('./Collection.js');

const path = require('path');
const fs = require('fs');

const PolarisRbx = require('./polaris-rbx');
const util = require('util');

// Add on additions to Eris prototypes (Such as awaitMessages or channel.sendInfo)
erisExtensions(Eris);

// COMMAND CLASS, BASE CLASS FOR ALL COMMANDS.
class Command {
	constructor (client) {
		this.client = client;
		this.name = `Unidentified command`;
		this.description = 'This command does not have a description';
		this.group = 'Unidentified';
		this.permissions = [];
		this.aliases = [];
		this.guildOnly = true;
		// add some placeholders
	}

	async process (message, args, prefix) {

		if (this.hidden) {
			if (message.author.id !== '183601072344924160') return;
		}
		if (!message.author) {
			message.channel.send(`:exclamation: \`message.author\` is not defined. This should not happen.\nError recorded. I'll get right on it!`);
			throw new Error('No author!');
		}
		var blacklist = await this.client.db.blacklist.get(message.author.id);
		if (blacklist) {
			return message.channel.sendError(message.author, {title: 'BLACKLISTED!', description: `You are blacklisted from using Polaris. This is likely due to a violation of our Terms of service.\n**Reason: **${blacklist.reason ? blacklist.reason : 'None provided.'}\n**Date: **${blacklist.time}`});
		}

		// DM allowed check
		if (!message.channel.guild) {
			// In DMs
			if (this.permissions.length !== 0 || this.guildOnly) return message.channel.sendError(message.author, 'That command is guild only!');
		} else {
			// In guild. Check blacklist
			blacklist = await this.client.db.blacklist.get(message.channel.guild.id);
			if (blacklist) {
				await message.channel.sendError(message.author, {title: 'BLACKLISTED!', description: `This server is blacklisted from using Polaris. This is likely due to a violation of our Terms of service.\n**Reason: **${blacklist.reason ? blacklist.reason : 'None provided.'}\n**Date: **${blacklist.time}`, fields: [{name: 'Leaving server', value: 'I am now leaving the server. Please do not re-invite me.'}]});
				message.channel.guild.leave();
				return;
			}
			// In a guild, check for message.member.
			if (!message.member) {
				console.log('No member ' + message.author.username);
				await getMembers(message.channel.guild);
				if (!message.author) {
					this.client.createMessage(message.channel.id, ":exclamation: I couldn't get your guild member. Please re-try this command. :exclamation:");
					throw new Error('Guild member is still not defined!');
				} else if (message.channel.guild.members.get(message.author.id)) {
					console.log('get author');
					message.member = message.channel.guild.members.get(message.author.id);
				}
			}
		}

		if (message.author.bot) return;

		if (this.client.cooldown.has(message.author.id)) {
			return message.channel.send(':x: - There is a command cooldown of 3 seconds. Please wait!');
		}
		if (message.author.id !== '183601072344924160') {
			for (var counter in this.permissions) {
				if (!message.member.permission.has(this.permissions[counter])) {
					return message.channel.sendError(message.author, {title: 'Error', description: `The \`${this.name}\` command requires permission \`${this.permissions[counter]}\` permission`});
				}
			}
		}
		if (!message.member && this.guildOnly) {
			console.log('MEMBER IS NULL. Content: ' + message.content + ' id: ' + message.id);
			return message.channel.sendError(message.author, "I couldn't find your guildMember. Please switch to `Online`, `Idle` or `DnD`. If issue persists, join our discord.");
		}
		// Add in some useful info for bug tracking
		try {
			let commandName = this.name;
			this.client.Raven.setContext({
				extra: {
					args: args,
					command: commandName
				},
				user: {
					username: message.author.username,
					discriminator: message.author.discriminator,
					ID: message.author.id
				}
			});
			const cooldown = this.client.cooldown;
			cooldown.add(message.author.id);
			setTimeout(() => cooldown.delete(message.author.id), 3000);

			await this.execute(message, args, prefix);
		} catch (e) {
			// this.client.Raven.captureException(e);
			console.log('Command catch: ' + e);
			await message.channel.sendError(message.author, {
				title: 'Oops! An error has occured.',
				description: `Polaris has encounted an unexpected and fatal error. We're right on it! You may want to join to join our [discord](https://discord.gg/eVyVK5J) to help with fixing this.\n \`\`\` ${e.message} \`\`\``
			});
		}
	}
}
module.exports.command = Command;

// CLIENT CLASS, BASE CLIENT CLASS.
module.exports.Client = class Client extends Eris.Client {
	constructor (token, Raven, options) {
		super(token, options);
		// Provide RAVEN and Eris libs
		this.Raven = Raven;
		this.eris = Eris;
		// Provides DB
		this.db = new DB(this);
		// For linkaccount and done.
		this.linkQueue = new Collection();
		// Roblox lib
		this.roblox = new PolarisRbx(this);

		// Command cooldown
		this.cooldown = new Set();

		this.ownerId = '183601072344924160';
		this.start();
	}
	// Assemble commands and prepare the bot.
	start () {
		// Load commands and assemble aliases
		this.commands = {
			aliases: {}
		};
		let lib = this.commands;
		let initClient = this;
		function search (dir) {
			fs.readdirSync(dir).forEach(function (file) {
				var stat = fs.statSync(path.join(dir, file));
				if (stat.isFile()) {
					let CmdFile = require(dir + '/' + file);
					let command = new CmdFile(initClient);
					let CMDName = file.replace('.js', '');
					command.name = CMDName;
					command.url = dir + '/' + file;

					lib[CMDName] = command;
					for (var i in command.aliases) {
						let alias = command.aliases[i].toLowerCase();
						lib.aliases[alias] = CMDName;
					}
				} else if (stat.isDirectory()) {
					search(path.join(dir, file));
				}
			});
		}
		search(path.join(__dirname, '/../Commands'));
		// start bot

		this.connect();
	}
	// Interfaces for channels. Fills empty fields in embeds and sends.

	logError (err, obj) {
		this.Raven.mergeContext({
			extra: obj
		});
		console.log(err);
		if (typeof err === 'object') err = util.inspect(err);
		this.Raven.captureException(err);
	}
};

// async poly fill
async function getMembers (guild) {
	guild.fetchAllMembers();
}
