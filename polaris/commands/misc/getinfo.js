const BaseCommand = require("../baseCommand");
const settings = require("../../../settings.json");

const { specialPeople } = settings;
const { getLink } = require("../../util/linkManager");

class getinfoCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Retrieves the Roblox information of a user.";
    this.aliases = ["whois"];
    this.group = "Roblox";
    this.guildOnly = true;
  }

  async execute (msg, args) {
    let robloxUser;

    let mentionedUser;

    if (msg.mentions.length === 0) {
      // Isn't a mention
      if (args.length !== 0) {
        const findStr = args.join(" ").toLowerCase();
        const user = msg.channel.guild.members.find(member => member.username.toLowerCase().startsWith(findStr));
        const userTwo = msg.channel.guild.members.get(args[0]);
        if (user) {
          mentionedUser = user;
        } else if (userTwo) {
          mentionedUser = userTwo;
        } else if (args[0]) {
          robloxUser = await this.client.roblox.getUserFromName(args[0]);
        }
      }
    } else {
      mentionedUser = msg.mentions[0];
    }

    if (!robloxUser) {
      mentionedUser = mentionedUser || msg.author;
      if (mentionedUser.bot) return msg.channel.sendError(msg.author, "Do you really think a bot has linked their account?! **Please mention a normal user!**");
      const rbxId = await getLink(mentionedUser.id);
      if (!rbxId) {
        return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");
      }
      robloxUser = await this.client.roblox.getUser(rbxId);
    }

    if (robloxUser.error) {
      if (robloxUser.error.status === 404) {
        return msg.channel.sendError(msg.author, {
          title: `I couldn't find that user on Roblox.`,
          description: `I couldn't find user \`${args[0]}\` on Roblox.`
        });
      }
      await msg.channel.sendError(msg.author, {
        title: "HTTP Error",
        description: `A HTTP Error has occured. Is Roblox Down?\n\`${robloxUser.error.message}\``
      });
      return this.client.logError(robloxUser.error);
    }

    const sentMsg = await msg.channel.sendInfo(msg.author, "Getting user info... please wait.");

    if (!sentMsg) return; // No perm to send msg.
    const playerInfo = await robloxUser.getInfo();
    if (playerInfo.error) {
      return sentMsg.edit({
        embed: {
          title: "HTTP Error",
          description: `A HTTP Error has occured. Is Roblox Down?\n\`${playerInfo.error.message}\``,
          timestamp: new Date(),
          color: 0xb3000a
        }
      });
    }
    const robloxId = robloxUser.id;
    const { joinDate } = playerInfo;
    const date = `${(joinDate.getDate())}/${(joinDate.getMonth() + 1)}/${(joinDate.getFullYear())} (D/M/Y)`;

    let text = `**Username:** ${playerInfo.username}\n**User ID:** ${robloxId}\n**Join date**: ${date}\n**Player age:** ${playerInfo.age}\n**Player status:** "${playerInfo.status}"`;
    if (playerInfo.blurb.length <= 200) {
      text = `${text}\n**Blurb:** ${playerInfo.blurb}`;
    } else {
      text = `${text}\n**Blurb:** ${playerInfo.blurb.substring(0, 200)}**...**`;
    }
    const toSend = {
      embed: {
        title: "Player info",
        description: text,
        url: `https://www.roblox.com/users/${robloxId}/profile`,
        thumbnail: {
          url: `https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId=${robloxId}`,
          height: 100,
          width: 100
        },
        timestamp: new Date(),
        color: 0x03b212
      }
    };

    // Extra bit for affiliates
    if (specialPeople[`${robloxUser.id}`]) {
      toSend.embed.fields = [
        {
          name: "Polaris affiliate",
          value: specialPeople[`${robloxUser.id}`]
        }
      ];
    }

    await sentMsg.edit(toSend);
  }
}
module.exports = getinfoCommand;
