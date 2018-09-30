'use strict';
let Polaris = require('../../util/client.js');
class getRoleCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = "Uses a previously linked account and a server's settings to give you roles according to your group rank(s).";
		//this.aliases = ['getroles, fetch'];
		this.group = 'Roblox account verification';
	}
	async execute (message, args, prefix) {
		const rbxId = await this.client.db.getLink(message.author.id);
		if (!rbxId) {
			// Remove verified role if they have it
			const res = await this.verifiedRoles(false, message.member);
			if (res.error) {
				return message.channel.sendError(message.author, {title: 'No permissions', description: res.error});
			}
			message.channel.sendError(message.author, {title: 'Please link your account', description: `You need to link your account to get your roles.\nGet started with \`${prefix}linkaccount\`.`});
			return;
		}
		const pendingMsg = await message.channel.send(`<@${message.author.id}> Fetching your group ranks... please wait.`);
		const response = await this.giveRoles(message.member, rbxId);
		response.timestamp = new Date();
		response.footer = {text: 'Sent for: ' + message.author.username, icon_url: message.author.avatarURL};
		if (response.error) {
			pendingMsg.edit({
				content: `<@${message.author.id}>`,
				embed: response,
				color: 0x23ff9f,
			});
		} else {
			pendingMsg.edit({
				content: `<@${message.author.id}>`,
				embed: response,
				color: 0xb3000a
			});
		}
	}

	/**
	 *
	 * @param member - The discord member object
	 * @param robloxId - The roblox Id of the user
	 * @returns {Promise<object>} Either an emebed or an object with property error, containing the error embed.
	 */
	async giveRoles (member, robloxId) {
		const roblox = this.client.roblox;
		// Give/ remove verified roles - Verified and Unverified
		const verif = await this.verifiedRoles(true, member);
		if (verif.error) return {error: {title: 'No permissions', description: verif.error}};

		// Get guild settings
		const guildSettings = await this.client.db.getSettings(member.guild.id);
		const noSettingsMsg = {
			title: "No settings!",
			description: "This server doesn't have any settings. Please ask a server admin to open `.settings` and set Polaris up."
		};
		if (!guildSettings) return {error: noSettingsMsg};
		// Brief check for not setup
		if ((!guildSettings.mainGroup.id) && (!guildSettings.subGroups || guildSettings.subGroups.length === 0) && guildSettings.binds.length === 0) {
			return {error: noSettingsMsg};
		}

		// Declarations
		// Key: Role snowflake, value: role name
		const rolesToGive = {};
		const rolesToRemove = {};
		const failedRoles = {};

		// Old binds
		if (guildSettings.binds && guildSettings.binds.length !== 0) {
			for (let bind of guildSettings.binds) {
				const group = await roblox.getGroup(bind.group);
				if (group.error) {
					return {error: {title: 'HTTP Error', description: `A HTTP Error has occurred. Is Roblox Down? Please retry. \`${group.error.message}\``}};
				}
				const userRank = await group.getRank(robloxId);
				if (bind.exclusive) {
					if (userRank === bind.rank) {
						give(bind.role);
					} else {
						remove(bind.role);
					}
				} else {
					if (userRank >= parseInt(bind.rank)) {
						give(bind.role);
					} else {
						remove(bind.role);
					}
				}
			}
		}
		// Main group
		if (guildSettings.mainGroup && guildSettings.mainGroup.id) {
			await checkGroup(guildSettings.mainGroup);
		}
		// Sub groups
		if (guildSettings.subGroups && guildSettings.subGroups.length !== 0) {
			for (let sub of guildSettings.subGroups) {
				await checkGroup(sub);
			}
		}
		// give em - TEMP! some of this might get into the real func. unlikely; its shit.
		const roles = member.guild.roles;
		const giveRolesArr = Object.keys(rolesToGive);
		const rolesRmv = Object.keys(rolesToRemove);
		let giveArrNew = [];
		let rmvArrNew = [];
		for (let role of giveRolesArr) {
			if (roles.get(role)) {
				// give it
				giveArrNew.push( roles.get(role).name);

			}
		}
		for (let role of rolesRmv) {
			if (roles.get(role)) {
				// give it
				rmvArrNew.push(roles.get(role).name);

			}
		}
		return {
			title: "here u are sir!!",
			description: "btw ur gay",
			fields: [
				{
					name: "Give roles",
					value: `_${giveArrNew.join(', ')}_`
				},
				{
					name: "Remove roles",
					value: `_${rmvArrNew.join(', ')}_`
				}
			]
		};
		function give(id) {
			if (rolesToGive[id]) return false;
			if (rolesToRemove[id]) delete rolesToRemove[id];
			rolesToGive[id] = true;
			console.log(`Added ${id} to roles to give`);
		}

		function remove(id) {
			if (rolesToGive[id] || rolesToRemove[id]) return false; // stop; give roles are more important or already removing
			rolesToRemove[id] = true;
			console.log(`Added ${id} to roles to remove`);
		}
		// Checks a group for ranks to roles/binds. For subgroup & main group.
		async function checkGroup (obj) {
			const group = await roblox.getGroup(obj.id);
			// use useRank on everything = less http
			const userRank = await group.getRank(robloxId);
			// ranks to roles
			if (obj.ranksToRoles) {

				const userRankName = roleFromRank(group.roles, userRank);
				for (let rank of group.roles) {
					const role = member.guild.roles.find(current => current.name.toLowerCase() === rank.Name.toLowerCase());
					if (role) {
						if (userRankName && userRankName.toLowerCase() === role.name.toLowerCase()){
							give(role.id);
						} else {
							remove(role.id);
						}
					}
				}
			}
			if (obj.binds) {
				const userRank = await group.getRank(robloxId);
				for (let bind of obj.binds) {
					if (bind.exclusive) {
						if (userRank === bind.rank) {
							give(bind.role);
						} else {
							remove(bind.role);
						}
					} else {
						if (userRank >= parseInt(bind.rank)) {
							give(bind.role);
						} else {
							remove(bind.role);
						}
					}
				}
			}
		}
	}
	verifiedRoles() {
		return true;
	}
}
function roleFromRank(roles, rank) {
	for (let role of roles) {
		if (role.Rank === rank) {
			return role.Name;
		}
	}
}

module.exports = getRoleCommand;