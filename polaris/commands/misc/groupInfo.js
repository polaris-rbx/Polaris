const BaseCommand = require("../baseCommand");

class getGroupCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Shows information about the Group Id provided, or the main group currently set.";
    this.aliases = ["getGroupInfo", "group", "getGroup", "groupInfo"];
    this.group = "Roblox";
    this.guildOnly = false;
  }

  async execute (msg, args, p) {
    let groupId;
    let fromSettings = false;
    if (args[0]) {
      if (!isNaN(args[0])) {
        groupId = args[0];
      } else {
        const grp = await this.client.roblox.getGroupByName(args[0]);
        groupId = grp.id;
        if (!groupId) return msg.channel.sendError(msg.author, "Oops! Group not found.");
      }
    } else if (msg.channel.guild) {
      const settings = await this.client.db.servers.get(msg.channel.guild.id);
      if (settings.mainGroup && settings.mainGroup.id) {
        groupId = settings.mainGroup.id;
        fromSettings = true;
      } else {
        return msg.channel.sendError(msg.author, {
          title: `Must provide group id or set main group id`,
          description: `Please **either**:\n  * Set Group ID in \`${p}settings\` or\n  * Provide a group id to get info from.`
        });
      }
    } else {
      return msg.channel.sendError(msg.author, {
        title: `Must provide group id or set main group id`,
        description: `Please **either**:\n  * Set Group ID in \`${p}settings\` or\n  * Provide a group id to get info from.`
      });
    }

    const sentMsg = await msg.channel.sendInfo(msg.author, "Getting group info... please wait.");

    if (!sentMsg) return; // No perm to send msg.
    const groupInfo = await this.client.roblox.getGroup(groupId);
    if (groupInfo.error) {
      if (groupInfo.error.status === 404) {
        return sentMsg.edit({
          embed: {
            title: "Group not found",
            description: "I couldn't find that group on Roblox. Please check the id, and try again.",
            timestamp: new Date(),
            color: 0xb3000a
          }
        });
      }
      return sentMsg.edit({
        embed: {
          title: "HTTP Error",
          description: `A HTTP Error has occurred. Is Roblox Down?\n\`${groupInfo.error.message}\``,
          timestamp: new Date(),
          color: 0xb3000a
        }
      });
    }

    // EMBED PART

    const title = fromSettings ? `Main group information` : `Group information for ${groupInfo.name}`;
    // Build rank test bit
    let ranksText = "";
    for (let r = 0; r < groupInfo.roles.length; r++) {
      const role = groupInfo.roles[r];
      ranksText += `${r + 1}: **Name**: \`${role.name}\` - **Rank Id:**: \`${role.rank}\`\n`;
    }

    // Build fields. Only show desc if it exists.
    const fields = [];
    if (groupInfo.description !== "") {
      fields.push({
        name: `Group description`,
        value: groupInfo.description.length > 400 ? groupInfo.description.substring(0, 400) : groupInfo.description
      });
    }
    if (ranksText.length < 1024) {
      fields.push({
        name: `Group ranks`,
        value: ranksText
      });
    } else {
      // regen: cut in half
      let ranksText1 = "";
      for (let r = 0; r < groupInfo.roles.length / 2; r++) {
        const role = groupInfo.roles[r];
        ranksText1 += `${r + 1}: **Name**: \`${role.name}\` - **Id:**: \`${role.rank}\`\n`;
      }
      let ranksText2 = "";
      for (let r = groupInfo.roles.length / 2; r < groupInfo.roles.length; r++) {
        const role = groupInfo.roles[r];
        ranksText2 += `${r + 1}: **Name**: \`${role.name}\` - **Id:**: \`${role.rank}\`\n`;
      }
      fields.push({
        name: `Group ranks 1`,
        value: ranksText1
      });
      fields.push({
        name: `Group ranks 2`,
        value: ranksText2
      });
    }

    if (groupInfo.shout) {
      fields.push({
        name: "Group shout",
        value: `${groupInfo.shout.message}\n  **By**: ${groupInfo.shout.postedBy}`,
        inline: true
      });
    }
    fields.push({
      name: "Members",
      value: groupInfo.memberCount,
      inline: true
    });

    let ownerText;
    if (groupInfo.owner) {
      ownerText = `[${groupInfo.owner.username}](https://www.roblox.com/users/${groupInfo.owner.userId}/profile)`;
    } else {
      ownerText = `Unowned`;
    }
    sentMsg.edit({
      embed: {
        title,
        color: 0x168776,
        description: `**Group name**: ${groupInfo.name}\n**Group ID:**: ${groupInfo.id}\n**Owned by**: ${ownerText}`,
        thumbnail: {
          url: groupInfo.emblemUrl,
          height: 100,
          width: 100
        },
        timestamp: new Date(),
        url: `https://www.roblox.com/Groups/group.aspx?gid=${groupInfo.id}`,
        fields
      }
    });
  }
}
module.exports = getGroupCommand;
