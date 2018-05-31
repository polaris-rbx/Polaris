"use strict";
//const settings = require("./settings.json");
const Raven = require('raven');
Raven.config('https://655dab4235f64421bae085050790fd21:efe96e46a2024cb28aef989abb687893@sentry.io/242368').install();

const settings = require("./settings.json");
const Polaris = require("./util/client.js");
const client = new Polaris.client(settings.token, Raven, {maxShards: "auto"});

const probe = require('pmx').probe();


//Raven error catcher, for anything that isn't caught normally. Shouldn't really be used.
Raven.context(function () {

	var accountLinks = 0;
	async function updateValues(){
		accountLinks = await client.db.users.count().run();

	}
	setInterval(updateValues, 600000);
	updateValues();

	probe.metric({
		name    : 'Account links',
		value   : function() {
			return accountLinks;
		}
	});

	probe.metric({
		name    : 'Guilds',
		value   : function() {
			return client.guilds.size;
		}
	});

	client.on("ready", () => {
		console.log(`Bot now running on ${client.guilds.size} servers`);
		client.editStatus("online", {name: `${client.guilds.size} servers | .help`});

	});

	//Fires when the bot joins a new guild. This updates the status and logs it.
	client.on("guildCreate", async guild => {
		console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
		client.editStatus("online", {name: `${client.guilds.size} servers | .help`});

	});

	client.on("guildMemberAdd", async function(guild, member) {
		if (member.bot) return;
		const settings = await client.db.getSettings(guild.id);
		if (settings.autoVerify) {
			var rbxId = await client.db.getLink(member.id);
			if (settings && rbxId) {
				var res = await client.commands.getrole.giveRoles(settings, member, rbxId);
				if (res) {
					res.title = "Welcome to " + guild.name;
					res.description = "I have made added the following roles as you are already verified.";
					var DMChannel = await member.user.getDMChannel();
					DMChannel.sendSuccess(member.user, res);
				}

			}
		}


	});

	client.on("messageCreate", async (message) => {
		//Command handler
		if (!message.content.startsWith('.')) return;

		const args = message.content.slice(1).trim().split(/ +/g);
		const command = args.shift().toLowerCase();
		//Main command handler. For commands used with the main 'alias'
		if (client.commands[command]) {
			client.commands[command].process(message, args);
			//Run if its using an alias
		} else if (client.commands.aliases[command]) {

			client.commands[client.commands.aliases[command]].process(message, args);

		}
	});


	process.on('unhandledRejection', (reason, p) => {
		client.logError(reason, p);
		console.log("ERROR FOUND: " + reason + "\nAT PROMISE: " + p);


	});

}); //Ends context
