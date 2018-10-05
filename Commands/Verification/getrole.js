'use strict';
let Polaris = require('../../util/client.js');
class getRoleCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = "Uses a previously linked account and a server's settings to give you roles according to your group rank(s).";
		this.aliases = ['getroles, fetch'];
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
			response.error.color = 0xb3000a;
			pendingMsg.edit({
				content: `<@${message.author.id}>`,
				embed: response.error
			});
		} else {
			response.color = response.color||0x23ff9f;
			pendingMsg.edit({
				content: `<@${message.author.id}>`,
				embed: response
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
		// Iterates roles to give/remove, checks that they exist & if user has / doesn't have them
		const roles = member.guild.roles;
		const memberRoles = member.roles;
		const botHighest = member.guild.members.get(this.client.user.id).highestRole.position;
		const giveRolesArr = Object.keys(rolesToGive);
		const rolesRmv = Object.keys(rolesToRemove);

		const giveArrNew = [];
		const rmvArrNew = [];
		const failedRoles = [];
		for (const role of giveRolesArr) {
			// if role exists & they don't have it
			const discordRole = roles.get(role);
			if (discordRole && !memberRoles.includes(role) && discordRole.position < botHighest) {
				const success = await addRole(member, discordRole.id);
				if (success) {
					giveArrNew.push( discordRole.name);
				} else {
					failedRoles.push(discordRole.name);
				}
			}
		}
		// if role exists & they shouldn't have it
		for (const role of rolesRmv) {
			const discordRole = roles.get(role);
			if (discordRole && memberRoles.includes(role) && discordRole.position < botHighest) {
				const success = await removeRole(member, discordRole.id);
				if (success) {
					rmvArrNew.push( discordRole.name);
				} else {
					failedRoles.push(discordRole.name);
				}
			}
		}
		// Checks/msg send. A bit messy; localisation will probably change.
		const changeNick = await this.updateNickname(guildSettings, member, robloxId);
		let nickMsg;
		if (changeNick) {
			nickMsg = changeNick.error ? `Error updating nickname:\n\`\`\`${changeNick.error.message}\`\`\`` : `Changed nickname to ${changeNick}.`;
		}
		const returnObj = {
			title: "Successfully updated you",
			description: `Please note that Roblox rank data is cached for up to 15 minutes.\n${nickMsg ? nickMsg :""}`,
			fields: [],
			color: 0x23ff9f,
		};
		// Check if arrays have any contents. Add field if so.
		if (giveArrNew.length > 0) returnObj.fields.push({
			name: "I gave these roles:",
			value: giveArrNew.join('\n'),
			inline: true
		});

		if (rmvArrNew.length > 0) returnObj.fields.push({
			name: "I removed these roles:",
			value: rmvArrNew.join('\n'),
			inline: true
		});

		if (failedRoles.length > 0) returnObj.fields.push({
			name: "I couldn't add/remove these roles:",
			value: `Please ensure my highest role is above these.\n${failedRoles.join('\n')}`,
			inline: true
		});
		// if no changes happened
		if (!nickMsg && returnObj.fields.length === 0) return {
			title: "No changes made",
			description: "There are no roles to give or remove, and nickname is correct.",
			color: 0x168776
		};
		else return returnObj;




		function give(id) {
			if (rolesToGive[id]) return false;
			if (rolesToRemove[id]) delete rolesToRemove[id];
			rolesToGive[id] = true;
		}

		function remove(id) {
			if (rolesToGive[id] || rolesToRemove[id]) return false; // stop; give roles are more important or already removing
			rolesToRemove[id] = true;
		}
		async function addRole(member, roleId) {
			try {
				await member.addRole(roleId);
			} catch (err) {
				console.log(err);
				return false;
			}
			return true;
		}

		async function removeRole(member, roleId) {
			try {
				await member.removeRole(roleId);
			} catch (err) {
				console.log(err);
				return false;
			}
			return true;
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
	async updateNickname (settings, member, robloxId) {
		const client = this.client;
		if (member.canEdit(member.guild.members.get(client.user.id))) {
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
					member.edit({
						nick: template
					}, "Nickname management is enabled.");
					return template;
				}
			}
		}
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


