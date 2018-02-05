"use strict";
//const settings = require("./settings.json");
var Raven = require('raven');
Raven.config('https://655dab4235f64421bae085050790fd21:efe96e46a2024cb28aef989abb687893@sentry.io/242368').install();

var Polaris = require("./util/client.js");
var client = new Polaris.client("MzE0Nzc2OTUyNTQ2NTI1MTg2.DTKxZQ.mQhYOKQAuhUd4YpyMcCkegsPY94", Raven);

//Raven error catcher, for anything that isn't caught normally. Shouldn't really be used.
Raven.context(function () {

	client.on("ready", () => {
		console.log(`Bot now running on ${client.guilds.size} servers`);
		client.editStatus("online", {name: `${client.guilds.size} servers | .help`});

	});

	//Fires when the bot joins a new guild. This updates the status and logs it.
	client.on("guildCreate", async guild => {
		console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
		client.editStatus("online", {name: `${client.guilds.size} servers | .help`});

	});



	client.on("messageCreate", (message) => {
		//Command handler
		if (message.author.bot) return;
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


}); //Ends context
