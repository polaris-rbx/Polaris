const { aquariusKey } = require("../../../settings.json");
const { getLink, getCode } = require("../../util/linkManager");
const BaseCommand = require("../baseCommand");

class linkAccountCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Creates an account link to allow for role retrieval.";
    this.aliases = ["verify", "link", "relink"];
    this.group = "Roblox account verification";
  }

  async execute (msg, args, prefix) {
    // If no username, prompt for it.
    if (!aquariusKey) {
      return msg.channel.sendInfo(msg.author, {
        title: "Unofficial Polaris instance",
        description: "Verification is provided by the main Aquarius verification system. Please go [here](https://verify.nezto.re/discord) to link your account.\nYou can link by providing a code on your profile, or by joining a game.",
        url: "https://verify.nezto.re/discord"
      });
    }
    let username = args[0];

    if (!username) {
      // Prompt for username
      const rbxMsg = await msg.channel.prompt(msg.author, {
        title: "I need your Roblox name",
        description: `Hey there \`${msg.author.username}\`! I need your Roblox name to get started. What is your Roblox username?`,
        fields: [{
          name: "Try the web version",
          value: "The web version is easier to use, and allows for game verification. [Try it out](https://verify.nezto.re/discord)!"
        }],
        url: "https://verify.nezto.re/discord"
      });
      if (!rbxMsg) return;
      username = rbxMsg.content;
    }

    // Roblox NAME VALIDATION
    if (searchForChars(username, ["?", "<", ">", "~", "|", "%", "\""])) return msg.channel.sendError(msg.author, "Roblox usernames may only contain letters, numbers or the _ symbol.");
    // Get Roblox userID from username, return error if not existing. Check that error is non-existant user error.
    const newUser = await this.client.roblox.getUserFromName(username);
    if (!newUser) {
      return msg.channel.sendError(msg.author, {
        title: "HTTP Error",
        description: `I have encountered a HTTP error. Is Roblox Down?`
      });
    }
    if (newUser.error || !newUser.id) {
      if (newUser.error.status === 404) {
        return msg.channel.sendError(msg.author, {
          title: "User not found",
          description: `I could not find user \`${username}\` on Roblox.`
        });
      }
      msg.channel.sendError(msg.author, {
        title: "HTTP Error",
        description: `A HTTP Error has occured. Is Roblox Down?\n\`${newUser.error.message}\``
      });
      return this.client.logError(newUser.error);
    }
    // ALREADY EXIST CHECK
    const current = await getLink(msg.author.id);
    if (current) {
      const robloxUser = await this.client.roblox.getUser(current);
      if (!newUser.error) {
        const user = robloxUser.username;
        if (robloxUser.username === username) {
          return msg.channel.sendError(msg.author, {
            title: "You are already linked to that account",
            description: `You are already linked to the Roblox account \`${robloxUser.username}\` and id \`${robloxUser.id}\`!\nDo \`${prefix}getroles\` to get started.`,
            url: "https://verify.nezto.re/discord"
          });
        }
        const opt = await msg.channel.restrictedPrompt(msg.author, {
          title: "Hold up! You have already linked your account.",
          description: `**PLEASE READ FULLY**\nAccount details: \`${user}\` and ID \`${current}\`.\n If this the Roblox account you want to use, just do \`${prefix}getroles\`! \nDo you want to contiue?`
        }, ["Yes", "No"]);
        if (!opt) return;
        if (opt.content.toLowerCase() !== "yes") return msg.channel.sendInfo(msg.author, "Cancelled account re-linking.");
      }
    }

    const code = await getCode(msg.author.id, newUser.id);
    if (!code) {
      throw new Error("Failed to obtain code");
    }
    msg.channel.sendInfo(msg.author, {
      title: "Account link code - Please read FULLY",
      description: `You are linking account with account \`${username}\` with UserID \`${newUser.id}\`.\nPlease place the following code in your Roblox profile - Put it in your status, accessible through [my feed](https://www.roblox.com/feeds/).`,
      fields: [
        {
          name: "Code",
          value: `\`${code}\``
        },
        {
          name: "After you are done",
          value: `Once you have put the code in your profile, run the \`${prefix}done\` command! :)`
        },
        {
          name: "Timeout",
          value: `This request will time-out in **10 minutes.** Please run \`${prefix}done\` before then, or you'll need to restart!`
        },
        {
          name: "Web version",
          value: `We **recommend** that you use the [web version](https://verify.nezto.re/discord), and this allows you to verify by joining a verification game. See it [here](https://verify.nezto.re/discord)`
        }
      ],
      url: "https://verify.nezto.re/discord"
    });
  }
}
module.exports = linkAccountCommand;

function searchForChars (string, chars) {
  const arr = string.split("");
  for (const count in arr) {
    if (chars.includes(arr[count])) {
      return true;
    }
  }
  return false;
}
