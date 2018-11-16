'use strict';
let Polaris = require('../../util/client.js');
class getRoleCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = "Uses a previously linked account and a server's settings to give you roles according to your group rank(s).";
		this.aliases = ['getroles'];
		this.group = 'Roblox account verification';
	}
	async execute (msg) {
		// Check for settings

		const settings = await this.client.db.getSettings(msg.member.guild.id);
		if (!settings || !settings.mainGroup || (settings.mainGroup.binds === 0 && !settings.mainGroup.ranksToRoles)) {
			msg.channel.sendError(msg.author, {title: 'No settings', description: "This server isn't set up yet. Please ask an admin to set up Polaris.\nTry adding the main group."});
			return;
		}
		// Check for link
		const rbxId = await this.client.db.getLink(msg.author.id);
		if (!rbxId) {
			const res = await this.verifiedRoles(false, msg.member);
			if (res.error) {
				return msg.channel.sendError(msg.author, {title: 'No permissions', description: res.error});
			}
			const prefix = settings.prefix ? settings.prefix : '.';
			msg.channel.sendError(msg.author, {title: 'Please link your account', description: `You need to link your account to get your roles.\nGet started with \`${prefix}linkaccount\`.`});
			return;
		}
		const reply = await this.giveRoles(settings, msg.member, rbxId);
		if (reply) {
			if (reply.error) return msg.channel.sendError(msg.author, reply.error);
			msg.channel.sendSuccess(msg.author, reply);
			return;
		} else {
			msg.channel.sendError(msg.author, 'I could not find any roles to give or remove from you.\nRank data is cached for up to 15 minutes. If you were ranked recently, retry later.');
			return;
		}
	}

	// Return true for success, false for otherwise.
	async giveRoles (settings, member, robloxId) {
		const res = await this.verifiedRoles(true, member);
		if (res.error) return {title: 'No permissions', description: res.error};
		const rolesToGive = {};
		const rolesToRemove = {};

		var addedMsg = '';
		var removedMsg = '';
		var failedMsg = '';

		// Var to store pos of binds that relate to deleted roles. It'll only delete one broken bind per run, but that's better than none.
		var bindToDelete;
		// binds
		for (let current of settings.binds) {
			if (member.guild.roles.get(current.role)) {
				let group = await this.client.roblox.getGroup(current.group);
				if (group.error) {
					return {error: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + group.error.message + '`'}};
				}

				let rank = await group.getRank(robloxId);

				if (current.exclusive) {
					if (rank === current.rank) {
						rolesToGive[current.role] = current.role;
					} else {
						rolesToRemove[current.role] = current.role;
					}
				} else {
					if (rank >= parseInt(current.rank)) {
						rolesToGive[current.role] = current.role;
					} else {
						rolesToRemove[current.role] = current.role;
					}
				}
			} else {
				bindToDelete = current;
			}
		}

		if (bindToDelete) {
			settings.binds.splice(bindToDelete, 1);
			this.client.db.updateSetting(member.guild.id, {binds: settings.binds});
		}

		// ranks to roles
		if (settings.mainGroup.ranksToRoles && settings.mainGroup.id) {
			await this.processGroup(rolesToGive, rolesToRemove, member, settings.mainGroup, robloxId);
		}

		// SubGroups
		if (settings.subGroups && settings.subGroups.length > 0) {
			for (let sub of settings.subGroups) {
				await this.processGroup(rolesToGive, rolesToRemove, member, sub, robloxId);
			}
		}
		// ROLE GIVER
		for (let roleId of Object.keys(rolesToGive)) {
			if (rolesToRemove[roleId]) {
				delete rolesToRemove[roleId];
			}

			if (!checkForPresence(member.roles, roleId)) {
				console.log(`Give ${roleId}`);
				const role = member.guild.roles.get(roleId);
				try {
					if (role) {
						await member.guild.addMemberRole(member.id, roleId);
						addedMsg = `${addedMsg}${role.name}\n`;
					}
				} catch (err) {
					let roleName = role.name;
					if (roleName) {
						failedMsg = `${failedMsg}\n${roleName}`;
					}
				}
			}
		}

		// ROLE Remover
		for (let roleId of Object.keys(rolesToRemove)) {
			if (!rolesToGive[roleId]) {
				if (checkForPresence(member.roles, roleId)) {
					const role = member.guild.roles.get(roleId);
					try {
						if (role) {
							await member.guild.removeMemberRole(member.id, roleId);
							removedMsg = `${removedMsg}\n${role.name}`;
						}
					} catch (err) {
						let roleName = role.name;
						if (roleName) {
							failedMsg = `${failedMsg}\n${roleName}`;
						}
					}
				}
			}
		}
		const embed = {
			title: 'Successfully changed your roles:',
			fields: [],
			description: 'If a role was added, removed or failed to add it will be listed below.'
		};

		if (addedMsg !== '') {
			embed.fields.push({
				name: 'Added the following roles',
				value: addedMsg,
				inline: true
			});
		}
		if (removedMsg !== '') {
			embed.fields.push({
				name: 'Removed the following roles',
				value: removedMsg,
				inline: true
			});
		}
		if (failedMsg !== '') {
			embed.fields.push({
				name: "I couldn't add the following roles",
				value: failedMsg,
				inline: true
			});
		}
		let nickChanged = false;
		let newNick = await member.guild.updateNickname(settings, member, robloxId);
		if (newNick) {
			if (!newNick.error) {
				nickChanged = true;
			}

		}
		if (newNick.error) {
			embed.description = `${embed.description}\nNickname error: \`${newNick.error.message}\``;
		}
		if (embed.fields.length === 0) {
			// Return false. No roles added.
			if (nickChanged) {
				return {
					title: 'Changed your nickname',
					description: 'Changed nickname to:\n`' + newNick + '`'
				};
			} else return false;
		} else {
			if (nickChanged) embed.description = `${embed.description}\nChanged nickname to \`${newNick}\``;
			return embed;
		}

	}
	async verifiedRoles (isVerified, member) {
		const verifiedName = 'Verified';
		const unverifiedName = 'Unverified';

		let verifiedRole = member.guild.roles.find((role) => role.name === verifiedName);
		let unverifiedRole = member.guild.roles.find((role) => role.name === unverifiedName);
		// Check for roles existing. If they do not exist, create them.
		if (!verifiedRole) {
			// Create verified role
			try {
				verifiedRole = await member.guild.createRole({name: verifiedName});
			} catch (error) {
				return {error: 'I do not have permission to create roles. Please ask a server admin to grant me this permission.'};
			}
		}
		if (!unverifiedRole) {
			// Create unverified role
			try {
				unverifiedRole = await member.guild.createRole({name: unverifiedName});
			} catch (error) {
				return {error: 'I do not have permission to create roles. Please ask a server admin to grant me this permission.'};
			}
		}
		// If user verified
		if (isVerified) {
			// Check for verified role. Add if don't have.
			if (!checkForPresence(member.roles, verifiedRole.id)) {
				// Add role
				try {
					await member.guild.addMemberRole(member.id, verifiedRole.id, 'User is verified');
				} catch (error) {
					return {error: 'I do not have permission to add roles. Please ask a server admin to grant me this permission, or move my role.'};
				}
			}
			// Check for unverified role. Remove if have.
			if (checkForPresence(member.roles, unverifiedRole.id)) {
				// Add role
				try {
					await member.guild.removeMemberRole(member.id, unverifiedRole.id, 'User is verified');
				} catch (error) {
					return {error: 'I do not have permission to remove roles. Please ask a server admin to grant me this permission, or move my role.'};
				}
			}
		} else {
			// If user NOT verified
			// Check for verified role. Remove if have.
			if (checkForPresence(member.roles, verifiedRole.id)) {
				// Add role
				try {
					member.guild.removeMemberRole(member.id, verifiedRole.id, 'User is not verified');
				} catch (error) {
					return {error: 'I do not have permission to add roles. Please ask a server admin to grant me this permission, or move my role.'};
				}
			}
			// Check for unverified role. add if don't have.
			if (!checkForPresence(member.roles, unverifiedRole.id)) {
				// Add role
				try {
					member.guild.addMemberRole(member.id, unverifiedRole.id, 'User is not verified');
				} catch (error) {
					return {error: 'I do not have permission to remove roles. Please ask a server admin to grant me this permission, or move my role.'};
				}
			}
		}
		return true;
	}
	// messy: lots of params.
	/**
	 *
	 * @param rolesToGive
	 * @param rolesToRemove
	 * @param member
	 * @param groupSettings
	 * @param robloxId
	 * @return {Promise<{error: {title: string, description: string}}>}
	 */
	async processGroup(rolesToGive, rolesToRemove,member, groupSettings, robloxId) {
		const group = await this.client.roblox.getGroup(groupSettings.id);
		if (group.error) {
			this.client.logError(group.error);
			return {error: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + group.error.message + '`'}};
		}
		// Check ranks to roles
		if (groupSettings.ranksToRoles) {
			const groupRanks = group.roles;
			const userRank = await group.getRole(robloxId);
			if (!userRank) throw new Error('User rank is not defined?');
			// Give user their role if it exists.
			const role = member.guild.roles.find(current => current.name.toLowerCase() === userRank.toLowerCase());

			if (role) {
				rolesToGive[role.id] = role.id;
				// Take out of remove list if there.
				if (rolesToRemove[role.id]) {
					delete rolesToRemove[role.id];
				}
			}

			for (let thisOne of groupRanks) {
				const check = member.guild.roles.find(current => current.name.toLowerCase() === thisOne.Name.toLowerCase());
				if (check) {
					if (!rolesToGive[check.id]) {
						rolesToRemove[check.id] = check.id;
					}
				}
			}
		}
		// Check binds
		if (groupSettings.binds && groupSettings.binds.length > 0) {
			console.log(groupSettings.binds);
			for (let current of groupSettings.binds) {
				const rank = await group.getRank(robloxId);

				if (current.exclusive) {
					if (rank === current.rank) {
						rolesToGive[current.role] = current.role;
					} else {
						rolesToRemove[current.role] = current.role;
					}
				} else {
					if (rank >= parseInt(current.rank)) {
						rolesToGive[current.role] = current.role;
					} else {
						rolesToRemove[current.role] = current.role;
					}
				}
			}
		}

	}
}
module.exports = getRoleCommand;

function checkForPresence (array, value) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === value) {
			return true;
		}
	}
	return false;
}

