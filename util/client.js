//Require dependencies
var Eris = require("eris");
var erisExtensions = require("./erisExtensions.js");
var db = require("./db.js");

const path = require('path');
const fs = require('fs');


//Add on additions to Eris prototypes (Such as awaitMessages or channel.sendInfo)
erisExtensions(Eris);

// COMMAND CLASS, BASE CLASS FOR ALL COMMANDS.
class Command {
	constructor(client) {
		this.client = client;
		this.name = `Unidentified command`;
		this.description = "This command does not have a description";
		this.group = "Unidentified";
		this.permissions = [];
		this.aliases = [];
		this.guildOnly = true;

	// add some placeholders
	}


	process(message, args) {
		for (var counter in this.permissions) {
			if (!message.member.permission.has(this.permissions[counter])) {
				return message.channel.sendError(message, {title: "Error", description: `The \`${this.name}\` command requires permission \`${this.permissions[counter]}\` permission`});
			}
		}
		//DM allowed check
		if (!message.guild) {
			if (this.permissions.length != 0) return message.channel.sendError(message.author, "That command is guild only!");
			if (this.guildOnly) return message.channel.sendError(message.author, "That command is guild only!");
		}
		//Add in some useful info for bug tracking
		this.client.Raven.setContext({
			user: {
				username: message.author.username,
				ID: message.author.id,
			},
		});

		try {
			this.execute(message, args);
		}
		catch (e) {
			let commandName = this.name;
			this.client.Raven.mergeContext({
				extra: {
					args: args,
					command: commandName

				}
			});
			this.client.Raven.captureException(e);
			console.log(e);
		}
	}


}
module.exports.command = Command;





//CLIENT CLASS, BASE CLIENT CLASS.
module.exports.client = class client extends Eris.Client {
	constructor(token, Raven){
		super(token);
		//Provide RAVEN and Eris libs
		this.Raven = Raven;
		this.eris = Eris;
		//Provides DB
		this.db = new db(this);

		this.start();
	}
	//Assemble commands and prepare the bot.
	start() {

		//Load commands and assemble aliases
		this.commands = {
			aliases: {}
		};
		let lib = this.commands;
		let initClient = this;
		function search(dir) {
			fs.readdirSync(dir).forEach(function (file) {
				var stat = fs.statSync(path.join(dir, file));
				if (stat.isFile()) {
					let cmdFile = require(dir + '/' + file);
					let command = new cmdFile(initClient);
					let CMDName = file.replace('.js', '');
					command.name = CMDName;

					lib[CMDName] = command;
					for (var i in command.aliases) {
						lib.aliases[command.aliases[i]] = CMDName;
					}
				}else if (stat.isDirectory()) {
					search(path.join(dir, file));
				}
			});
		}
		search(__dirname + "/../Commands");
		//start bot

		this.connect();
	}
	//Interfaces for channels. Fills empty fields in embeds and sends.


	logError(err, obj){
		this.Raven.mergeContext({
			extra: obj
		});
	}


};
