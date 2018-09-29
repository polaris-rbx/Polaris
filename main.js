'use strict';
const settings = require('./settings.json');

const Raven = require('raven');
Raven.config(settings.sentry, {
	captureUnhandledRejections: true,
	autoBreadcrumbs: true,
	sendTimeout: 3
}).install();

const Polaris = require('./util/client.js');
const client = new Polaris.Client(settings.token, Raven, {maxShards: 'auto'});

const probe = require('pmx').probe();

const DBL = require('dblapi.js');
const dbl = new DBL(settings.dblToken, client) // eslint-disable-line

// Raven error catcher, for anything that isn't caught normally. Shouldn't really be used.
Raven.context(function () {
	var accountLinks = 0;
	async function updateValues () {
		accountLinks = await client.db.users.count().run();
	}
	setInterval(updateValues, 600000);
	updateValues();

	probe.metric({
		name: 'Account links',
		value: function () {
			return accountLinks;
		}
	});

	probe.metric({
		name: 'Guilds',
		value: function () {
			return client.guilds.size;
		}
	});

	client.on('ready', () => {
		console.log(`Bot now running on ${client.guilds.size} servers`);
		client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3});
	});

	// Fires when the bot joins a new guild. This updates the status and logs it.
	client.on('guildCreate', async guild => {
		console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
		client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3});
	});

	client.on('guildDelete', async guild => {
		console.log(`Guild ${guild.name} has removed Polaris.`);
		client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3});
	});

	client.on('guildMemberAdd', async function (guild, member) {
		if (member.bot) return;
		const settings = await client.db.getSettings(guild.id);
		if (settings.autoVerify) {
			var rbxId = await client.db.getLink(member.id);
			if (settings && rbxId) {
				var res = await client.commands.getrole.giveRoles(settings, member, rbxId);
				if (res) {
					if (res.error) return; // If errors, fail silently. No need for user to see.
					res.title = 'Welcome to ' + guild.name;
					var DMChannel = await member.user.getDMChannel();
					DMChannel.sendSuccess(member.user, res);
				}
			} else if (!rbxId) {
				await client.commands.getrole.verifiedRoles(false, member);
			}
		}
	});
	client.on('error', function (error, shardId) {
		Raven.captureException(error, {
			level: 'fatal',
			extra: {
				shardId: shardId
			}
		});
	});
	client.on('messageCreate', async (message) => {
		// Command handler

		// If webhook
		if (!message.author) return message.channel.send('Oops. `message.author` is not defined. Please contact `Neztore#6998` if this issue persists.');
		// If bot
		if (message.author.bot) return;
		// Stop if it's DBL/Discordbots.pw
		if (message.channel.guild) {
			if (message.channel.guild.id === "264445053596991498" || message.channel.guild.id === "110373943822540800") return;
		}
		// New prefix handler
		const prefixMention = new RegExp(`^<@!?${client.user.id}> `);
		let prefix = '.';
		// Prefix msg which is shown to users. Used so that when a mention is used, it makes sense.
		let prefixMsg = prefix;

		const guild = message.channel.guild;
		if (guild) {
			const guildSettings = await client.db.getSettings(guild.id);
			if (!guildSettings) {
				console.log(`Guild ${guild.id} has no settings. Resolving.`);
				this.client.db.setupGuild(guild.id);
				return;
			}
			// it is in a server. Check if they have a custom prefix. If so set prefix to it.
			if (guildSettings.prefix && guildSettings.prefix !== '') {
				prefix = guildSettings.prefix;
				prefixMsg = prefix;
			}
		}

		// Check if user has mentioned bot. if so, set that to prefix. Else, check for custom prefix.
		if (message.content.match(prefixMention)) {
			prefix = message.content.match(prefixMention)[0];
			prefixMsg = `@Polaris#9752 `;
		}
		if (!message.content.startsWith(prefix)) return;

		const args = message.content.slice(prefix.length).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		// Main command handler. For commands used with the main 'alias'
		if (client.commands[command]) {
			client.commands[command].process(message, args, prefixMsg);
			// Run if its using an alias
		} else if (client.commands.aliases[command]) {
			client.commands[client.commands.aliases[command]].process(message, args, prefixMsg);
		}
	});
}); // Ends context
