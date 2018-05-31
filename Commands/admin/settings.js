"use strict";
let Polaris = require("../../util/client.js");
const rbx = require("roblox-js");
var COOLDOWN = new Map();

class settingsCommand extends Polaris.command {
	constructor(client){
		super(client);
		this.db = this.client.db;

		this.description = "Allows those with the `ADMINISTRATOR` permission to change server settings, such as main group and binds.";
		this.aliases = ["setting", "options", "configure", "config"];
		this.group = "Admin";
		this.permissions = ["administrator"];
		this.guildOnly = true;


	}

	async execute(msg, args){
		const client = this.client;
		//Cooldown mangagement
		if (COOLDOWN.has(msg.author.id)){
			msg.channel.sendError(msg.author, "Please complete all other prompts!\nThink this is an error? Join our Discord.(Link in `.info`)");
			return;
		} else {
			COOLDOWN.set(msg.author.id, true);
		}


		let raven = this.client.Raven;


		const guildSettings = this.guildSettings = await this.db.getSettings(msg.channel.guild.id);

		if (!this.guildSettings) {
			await this.db.setupGuild(msg.channel.guild);
			this.guildSettings = await this.db.getSettings(msg.channel.guild.id);
			console.log("No defaults? " + msg.channel.guild.id);
		}
		let current = menu;
		let done = false;
		let option = args[0];

		let menuName = "Main";

		if (option) {
			let optionLowerCase = option.toLowerCase();
			//Checks if their initial .settings [VALUE] is part of main menu. If it is, skips to that menu.
			if (current.subs[optionLowerCase] && current.subs[optionLowerCase].subs) current = current.subs[optionLowerCase];
			menuName = option.toLowerCase();
			menuName = capitalizeFirstLetter(menuName);
		}
		//Add global catch for settings.
		try {
			do {
				let embed = this.makeMenu(menuName, current);

				let res = await this.sendPrompt(msg, embed, current.subs);

				//If cancelled (returned null)
				if (res === "time") {
					//Remove from QUEUE
					COOLDOWN.delete(msg.author.id);
					done = true;
					return msg.channel.sendInfo(msg.author, "Prompt timed out.");
				}
				if (!res) {
					msg.channel.sendInfo(msg.author, "Cancelled prompt.");
					done = true;
					COOLDOWN.delete(msg.author.id);
					return;
				}
				current = current.subs[res];
				menuName = capitalizeFirstLetter(res);

				if (current.func){

					try {
						await current.func(msg, guildSettings, client);
					} catch(err) {
						done = true;
						console.log(err);
						throw new Error(err);
					}
					done = true;

				}


			} while (!done);
			COOLDOWN.delete(msg.author.id);
		} catch(error) {
			await msg.channel.sendError(msg.author, `The following error occurred during execution:\n\`${error}\``);
			//Remove from QUEUE
			COOLDOWN.delete(msg.author.id);
			//ALERT SENTRY
			raven.captureException(error);
			return;

		}

	}

	makeMenu(menuName, menu){
		//Mangages both Info and extra. Executes if they are functions.
		let info = this.isFunction(menu.info) ? menu.info(this.guildSettings) : menu.info;//Executes info if it is a function, else sets it as it is.
		if (menu.extra){
			let extra = this.isFunction(menu.extra) ? menu.extra(this.guildSettings) : menu.extra;
			info = `${info}\n${extra}\n`;
		} else {
			//Add a new line to make options clearer if extra isn't there.
			info = `${info}\n`;
		}

		if (!menu.subs) throw new Error("Menu has no sub-menus! Name: " + menuName);
		let subMenus = Object.values(menu.subs);
		let subNames = Object.keys(menu.subs);


		for (var i in subMenus) {
			info = `${info}\n**${capitalizeFirstLetter(subNames[i])}** - ${subMenus[i].info}`;
		}


		let embed = {
			title: `${menuName} menu`,
			description: info


		};
		//if (fields.length>0)embed.fields = fields;
		return embed;


	}

	async sendPrompt(message, embed, options) {
		embed.footer =  {text: `Say "cancel" to cancel`, icon_url: message.author.avatarURL};

		//Move all object keys to lowercase, ensures that user input will always match.
		var key, keys = Object.keys(options);
		var n = keys.length;
		var newobj = {};
		while (n--) {
			key = keys[n];
			newobj[key.toLowerCase()] = options[key];
		}
		options = newobj;

		var fn = msg => options[msg.content.toLowerCase()] && msg.author.id===message.author.id || msg.content.toLowerCase()==="cancel"&&msg.author.id===message.author.id;
		let m = await message.channel.sendInfo(message.author, embed);
		if (!m) {
			//If message doesn't send for whatever reason
			COOLDOWN.delete(message.author.id);
		}

		let res = await message.channel.awaitMessages(fn, {maxMatches: 1, time: 30000});

		res = res[0];
		if (!res) return "time";
		res = res.content;
		res = res.toLowerCase();
		if (res === "cancel") return;

		return res;
	}


	isFunction(object) {
		return !!(object && object.constructor && object.call && object.apply);
	}
}
module.exports = settingsCommand;


function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/*
SETTINGS MENU.
First letter is auto-capitalised.

* Each page MUST HAVE a info.
* Each page may have "extra". This is displayed in addition to info.
* Each page MUST HAVE EITHER:
	subs  OR func

	subs - Object. Contains sub-menus.
	func - Function to execute.
*/
const menu = {
	info: "Settings home. From here you can browse to various settings and update them. Please ensure you read each message both continuing.\n**Say the name of the option that you want to choose.**",
	subs: {
		group:{
			info: "Allows you to set the group ID of the main group for this server and toggle `Ranks to roles`.",
			extra: groupExtra,
			subs: {
				groupid: {
					info: "Allows you to update/set the ID of the main group for this server.",
					func: setMainGroupId,
				},


				"ranks to roles": {
					info: "Allows you to enable/disable ranks to roles.",
					extra: "Ranks to roles is a system that allows users to get their group rank as a discord role if the role and rank names match.",
					subs: {
						enable: {
							info: "Enable `ranks to roles`, allows roles which match group ranks **exactly** to be obtained with `.getroles`.",
							func: enableRTR
						},
						disable:{
							info: "Disable `ranks to roles`, Disables matching role retrieval.",
							func: disableRTR
						},

					}

				},

				binds:{
					info: "Allows you to add, remove and view Group binds. Group binds allow you to bind single ranks from other groups.",
					subs:{
						view:{
							info: "Displays all current group binds.",
							func: viewBinds,
						},
						add:{
							info: "Adds a new group bind.",
							func:addBind,
						},
						remove:{
							info: "Removes a group bind.",
							func: rmvBind,

						},
					}

				},
			},

		},
		server:{
			info: "Allows you to edit server settings.",
			subs: {
				autoverify: {
					info: "Auto verification means users will be given their roles when they join, if they are verified.",
					extra: (settings) => settings.autoVerify ? "Currently: `Enabled`.":"Currently: `Disabled`.",
					subs: {
						enable: {
							info: "Enable `Auto-verification`, causing new users to be automatically given their roles if verified.",
							func: enableAutoVerify
						},
						disable: {
							info: "Disable `Auto-verification`, meaning new users must manually get their roles.",
							func: disableAutoVerify
						}
					}
				},
			}
		}
	}

};

//SETTINGS FUNCTIONS.

//ALL SETTINGS FUNCTIONS APPEAR HERE. THE MENU ABOVE WILL LINK TO A FUNCTION.


//Group:
//EXTRA:
function groupExtra(settings){
	if (!settings.mainGroup || !settings.mainGroup.id || settings.mainGroup.id === 0) {
		return "There is currently no main group set! Use `groupid` to set the ID of your ROBLOX Group.";
	} else if (!settings.mainGroup.ranksToRoles && settings.mainGroup.id) {
		return `Group ID is currently set to ${settings.mainGroup.id}. Ranks to roles is \`Disabled\`.`;
	}else if (settings.mainGroup.ranksToRoles && settings.mainGroup.id) {
		return `Ranks to roles is \`enabled\` and the group ID is set to ${settings.mainGroup.id}`;

	} else {
		return "Use `groupid` to set the ID of your ROBLOX Group!";
	}
}

async function setMainGroupId(msg, settings, client) {
	var newGroupId;
	if (settings.mainGroup.id) {
		newGroupId = await msg.channel.prompt(msg.author, {title: "New group ID", description: `What is the new ID for your group?\nCurrently set to \`${settings.mainGroup.id}\`.`});
	} else {
		newGroupId = await msg.channel.prompt(msg.author, {title: "New group ID", description: "What is the ID of your group?"});
	}

	//If cancel or timeout stop
	if (!newGroupId) return;

	newGroupId = newGroupId.content;


	let groupRoles = null;
	try {
		groupRoles = await rbx.getRoles(newGroupId);
	} catch(error) {
		return msg.channel.sendError(msg.author, "I couldn't find that group on ROBLOX.");
	}

	if (!groupRoles) return;


	let newSetting = settings.mainGroup || {};
	newSetting.id = newGroupId;

	const success = await client.db.updateSetting(msg.channel.guild.id, {mainGroup: newSetting});
	if (success) {
		return msg.channel.sendSuccess(msg.author, `Successfully set the main group id to \`${newGroupId}\`!`);
	} else {
		return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
	}



}


//Enable ranksToRoles
async function enableRTR(msg, settings, client){
	if (!settings.mainGroup || !settings.mainGroup.id || settings.mainGroup.id === 0){
		return msg.channel.sendError(msg.author, "You must set a Group ID first!");
	} else {
		let newMain = settings.mainGroup;
		newMain.ranksToRoles = true;


		const success = await client.db.updateSetting(msg.channel.guild.id, {mainGroup: newMain});
		if (success) {
			msg.channel.sendSuccess(msg.author, `Successfully enabled \`ranks to roles\`!`);
		} else {
			return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
		}

	}
}

async function disableRTR(msg, settings, client){
	if (!settings.mainGroup || !settings.mainGroup.id || settings.mainGroup.id === 0){
		return msg.channel.sendError(msg.author, "You must set a Group ID first!");
	} else {
		let newMain = settings.mainGroup;
		newMain.ranksToRoles = false;
		const success = await client.db.updateSetting(msg.channel.guild.id, {mainGroup: newMain});
		if (success) {
			msg.channel.sendSuccess(msg.author, `Successfully disabled \`ranks to roles\`!`);
		} else {
			return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
		}
	}
}

//AUTO-VERIFY
async function enableAutoVerify(msg, settings, client) {
	if (!settings || (settings.binds.length ===0 && !settings.mainGroup.ranksToRoles)){
		return msg.channel.sendError(msg.author, "You must set up binds or ranks to roles before enabling auto verification!");
	}

	const success = await client.db.updateSetting(msg.channel.guild.id, {autoVerify: true});
	if (success) {
		msg.channel.sendSuccess(msg.author, `Successfully enabled \`Auto-verification\`!`);
	} else {
		return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
	}
}

async function disableAutoVerify(msg, settings, client) {
	if (!settings.mainGroup || !settings.mainGroup.id || settings.mainGroup.id === 0){
		return msg.channel.sendError(msg.author, "You must set a Group ID first before enabling auto-verification!");
	}

	const success = await client.db.updateSetting(msg.channel.guild.id, {autoVerify: false});
	if (success) {
		msg.channel.sendSuccess(msg.author, `Successfully disabled \`Auto-verification\`!`);
	} else {
		return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
	}
}

//BINDS FUNCTIONS
async function viewBinds(msg, settings, client){
	let embed = {fields: [],
		description: "Displaying current binds. Any binds that relate to deleted roles will be automatically removed.",
		title: "Current group binds"
	};

	let initialLength = settings.binds.length;

	if (!settings.binds || settings.binds.length <= 0) {
		return msg.channel.sendError(msg.author, {title: "No binds set", description: "You don't have any group binds set! Navigate to `binds` and say `add` to get started."});
	}
	let binds = settings.binds;
	for (var count=0; count < binds.length; count++) {
		let current = binds[count];

		let role = msg.channel.guild.roles.get(current.role);
		if (!role) {
			settings.binds.splice(count, 1);

			embed.fields.push({name: `Bind ${count + 1}`, value: `Deleted bind - Role removed`});
		} else {

			embed.fields.push({name: `Bind ${count + 1}`, value: `**Group ID:** ${current.group}\n**Group rank ID:** ${current.rank}\n**Role name:** ${role.name}\n**Exclusive:** ${current.exclusive}`, inline: true});
		}

	}
	//If one or more elements has been removed:
	if (settings.binds.length !== initialLength) {
		const success = await client.db.updateSetting(msg.channel.guild.id, {autoVerify: false});
		if (!success) {
			return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
		}
	}

	await msg.channel.sendInfo(msg.author, embed);
}



async function addBind(msg, settings, client) {
	if (settings.binds.length >= 25) {
		msg.channel.sendError(msg.author, "Oops! You can only have up to 25 seperate binds. Please consider using `ranksToRoles` or `sub groups`.");
	}
	//Variables
	let groupId = await msg.channel.prompt(msg.author, {title: "Please provide Group ID", description: "What is the ROBLOX group ID?"});
	if (!groupId) return;
	groupId = groupId.content;

	let rankId = await msg.channel.prompt(msg.author, {title: "Please provide Rank ID", description: "What is the ROBLOX Rank ID for this rank? It should be a number from 0 to 255."});
	if (!rankId) return;
	rankId = rankId.content;

	let roleName = await msg.channel.prompt(msg.author, {title: "Please provide role name", description: "What is the name of the Discord role? (Case sensitive)"});
	if (!roleName) return;
	roleName = roleName.content;

	let exclusive = await msg.channel.restrictedPrompt(msg.author, {title: "Is this bind Exclusive?", description: "Is this bind exclusive? If **Yes** then only this rank will get it.\nIf **no** all ranks above this rank will also recieve it."}, ["Yes", "No"]);
	if (!exclusive) return;
	exclusive = exclusive.content;

	if (exclusive.toLowerCase() === "yes"){
		exclusive = true;
	}else {
		exclusive = false;
	}

	//RANK ID VALIDATION
	try {
		rankId = parseInt(rankId);
	} catch(e) {
		return msg.channel.sendError(msg.author, `Rank ID must be a number between 0 and 255.`);
	}
	if (rankId > 255 || rankId < 0) {
		return msg.channel.sendError(msg.author, `Rank ID must be a number between 0 and 255.`);
	}

	//Validate Discord role - in guild?
	let roleId = null;
	if (!msg.channel.guild.roles.find((a)=>a.name === roleName)) {
		return msg.channel.sendError(msg.author, "I couldn't find a role in this discord with that name! **Please note that it is case sensitive.**");
	} else {
		let role = msg.channel.guild.roles.find((a)=>a.name === roleName);
		roleId = role.id;
	}


	try {
		await rbx.getRoles(groupId);
	} catch(error) {
		return msg.channel.sendError(msg.author, "I couldn't find that group on ROBLOX.");
	}


	let binds = settings.binds || [];
	//Check that there is no identical bind present
	for (var i = 0; i < binds.length; i++) {
		if (binds[i].rank === rankId && binds[i].role === roleId && binds[i].group === groupId && binds[i].exclusive === exclusive) {
			return msg.channel.sendError(msg.author, {title: "Action cancelled", description: "You already have a bind with those settings! If you would like to remove or edit it, remove the bind and add a new one."});
		}
	}

	binds.push({
		group: groupId,
		rank: rankId,
		role: roleId,
		exclusive: exclusive

	});
	const success = await client.db.updateSetting(msg.channel.guild.id, {binds: binds});

	if (!success) {
		return msg.channel.sendError(msg.author, `A database error has occurred. Please try again.`);
	} else if (exclusive) {
		msg.channel.sendSuccess(msg.author, `Successfully added an exclusive new bind with Group ID \`${groupId}\`, Rank ID \`${rankId}\` and Rolename \`${roleName}\`.`);
	} else {
		msg.channel.sendSuccess(msg.author, `Successfully added a non-exclusive bind with Group ID \`${groupId}\`, Rank ID \`${rankId}\` and Role name \`${roleName}\`.`);
	}




}
async function rmvBind(msg, settings, client){

	let embed = {fields: [],
		description: "Displaying current binds. Please say the `Bind ID` of the bind you would like to remove.",
		title: "Current group binds",
		footer: {icon_url: msg.author.avatarURL, text: `${msg.author.username} - Say an ID or "cancel"`}
	};


	if (!settings.binds || settings.binds.length <= 0) {
		return msg.channel.sendError(msg.author, {title: "No binds set", description: "You don't have any group binds set! Navigate to `binds` and say `add` to get started."});
	}

	for (var count=0; count < settings.binds.length; count++) {

		let current = settings.binds[count];

		let role = msg.channel.guild.roles.get(current.role);
		if (!role) {
			settings.binds.splice(count, 1);
			count = count - 1;
		} else {

			embed.fields.push({name: `Bind ${count + 1}`, value: `**Group ID:** ${current.group}\n**Group rank ID: ${current.rank}**\n**Role name:** ${role.name}\n**Exclusive:** ${current.exclusive}`});
		}

	}

	var fn = m => (parseInt(m.content, 10) > 0 && parseInt(m.content, 10) <= embed.fields.length && m.author.id===msg.author.id) || (m.content.toLowerCase()==="cancel"&&m.author.id===msg.author.id);
	let m = await msg.channel.sendInfo(msg.author, embed);
	if (!m) return;
	//CUSTOM IMPLEMENTATION/USE OF MESSAGE COLLECTOR TO ALLOW FOR ERROR MESSAGES
	const collector = new client.MessageCollector(msg.channel, fn, {maxMatches: 1, time: 30000});

	collector.on("nonMatch", function(m){
		if (m.author.id === msg.author.id) {
			msg.channel.sendError(msg.author, {
				title: "Please choose a valid option.",
				description: `Your choice of \`${m.content}\` was not valid. It must be a number, above 0 and below ${settings.binds.length}. Please try again! Content: ${m.content}`
			});
		}

	});

	collector.on("end", async function(res, reason){
		if (reason === "time") {
			msg.channel.sendInfo(msg.author, {title: "Timed out", description: "Prompt timed out. You needed to say a number within 30 seconds!"});
			return;
		}
		res = res[0];

		if (res.content.toLowerCase() === "cancel"){
			res.channel.sendInfo(msg.author, {title: "Cancelled", description: "Prompt cancelled."});
			return;
		}
		let loc = parseInt(res.content);
		//Account for the one added earlier to make numbers easier for user
		loc = loc - 1;

		if (!settings.binds[loc]) {
			msg.channel.sendError(msg.author, {title: "Oops! That wasn't meant to happen.", description: "It looks like your selection wasn't valid but was accepted. Please try again."});
			throw new Error(`Invalid selection. Selection: ${loc} Array: ${JSON.stringify(settings.binds)}`);
		}
		settings.binds.splice(loc);

		const success = await client.db.updateSetting(msg.channel.guild.id, {binds: settings.binds});
		if (success) {
			return msg.channel.sendSuccess(msg.author, {title: "Successfully updated", description: `Successfully removed the bind!`});
		} else {
			return msg.channel.sendError(msg.author, {title: "Oops! Something went wrong.", description: `Something went wrong with the database. Please try again.`});
		}



	});






}
