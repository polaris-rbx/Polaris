
let Polaris = require('../../util/client.js');

class getGroupCommand extends Polaris.command {
	constructor (client) {
		super(client);
		this.description = 'Shows information about the Group Id provided, or the main group currently set.';
		this.aliases = ['getGroupInfo', 'group'];
		this.group = 'Roblox';
		this.guildOnly = false;
	}
	async execute (msg, args, p) {
		let groupId;
		let fromSettings = false;
		if (args[0]) {
			if (!isNaN(args[0])) {
				groupId = args[0];
			} else {
				return msg.channel.sendInfo(msg.author, {title: "Not supported, here's the roblox search results!", description: `I don't currently support getting group info by name. Click [here](https://www.roblox.com/search/groups?keyword=${args[0]}) to view search results for that group.`});
			}
		} else {
			if (msg.channel.guild) {
				const settings = await this.client.db.servers.get(msg.channel.guild.id);
				if (settings.mainGroup && settings.mainGroup.id) {
					groupId = settings.mainGroup.id;
					fromSettings = true;
				} else {
					return msg.channel.sendError(msg.author, {title: `Must provide group id or set main group id`, description: `Please **either**:\n  * Set Group ID in \`${p}settings\` or\n  * Provide a group id to get info from.`});
				}
			} else {
				return msg.channel.sendError(msg.author, {title: `Must provide group id or set main group id`, description: `Please **either**:\n  * Set Group ID in \`${p}settings\` or\n  * Provide a group id to get info from.`});
			}
		}

		var sentMsg = await msg.channel.sendInfo(msg.author,'Getting group info... please wait.');

		if (!sentMsg) return; // No perm to send msg.
		var groupInfo = await this.client.roblox.getGroup(groupId);
		if (groupInfo.error) {
			if (groupInfo.error.status === 404) {
				return sentMsg.edit({
					embed: {
						title: 'Group not found',
						description: 'I couldn\'t find that group on Roblox. Please check the id, and try again.',
						timestamp: new Date(),
						color: 0xb3000a
					}
				});
			} else {
				return sentMsg.edit({
					embed: {
						title: 'HTTP Error',
						description: 'A HTTP Error has occured. Is Roblox Down?\n`' + groupInfo.error.message + '`',
						timestamp: new Date(),
						color: 0xb3000a
					}
				});
			}

		}

		// EMBED PART

		let title = fromSettings ? `Main group information` : `Group information for ${groupInfo.name}`;

		// Build rank test bit
		let ranksText = "";
		for (let r = 0; r < groupInfo.roles.length; r++) {
			let role = groupInfo.roles[r];
			ranksText += `${r + 1}: **Rank name**: \`${role.Name}\` - **Rank Id**: \`${role.Rank}\`\n`;
		}

		// Build fields. Only show desc if it exists.
		const fields = [];
		if (groupInfo.description !== "") {
			fields.push({
				name: `Group description`,
				value: groupInfo.description.length > 400 ?  groupInfo.description.substring(0, 400) : groupInfo.description,
			});

		}
		fields.push({
			name: `Group ranks`,
			value: ranksText,
		});
		sentMsg.edit({embed: {
			title: title,
			color: 0x168776,
			description: `**Group name**: ${groupInfo.name}\n**Group ID:**: ${groupInfo.id}\n**Owned by**: [${groupInfo.owner.Name}](https://www.roblox.com/users/${groupInfo.owner.Id})`,
			//	thumbnail: { roblox is bad. no image extension = no discord support.
			//	url: groupInfo.emblemUrl,
			//	height: 100,
			//	width: 100
			//},
			timestamp: new Date(),
			url: `https://www.roblox.com/Groups/group.aspx?gid=${groupInfo.id}`,
			fields: fields
		}});

	}
}
module.exports =  getGroupCommand ;
