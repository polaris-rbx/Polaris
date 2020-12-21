const { checkCode } = require("../../util/linkManager");
const { getLink } = require("../../util/linkManager");
const BaseCommand = require("../baseCommand");

class doneCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Completes an in-progress account link by checking your Roblox profile for the code.";
    this.aliases = ["ihavesuccessfullyputthecodeinmydesc"];
    this.group = "Roblox account verification";
  }

  async execute (msg, _a, prefix) {
    // Check with Aquarius
    const aquariusResponse = await checkCode(msg.author.id);

    // Search for code
    if (aquariusResponse && aquariusResponse.success) {
      let { robloxId } = aquariusResponse;
      const verified = await this.client.CommandManager.commands.getrole.verifiedRoles(true, msg.member);
      if (verified.error) {
        return msg.channel.sendError(msg.author, {
          title: "Permission error",
          description: verified.error
        });
      }
      if (!robloxId) {
        console.error(`No Roblox id returned from aquarius!`);
        robloxId = await getLink(msg.author.id);

        if (!robloxId) {
          throw new Error("Failed to get your account link: Please try again.");
        }
      }

      const settings = await this.client.db.getSettings(msg.channel.guild.id);
      const res = await this.client.CommandManager.commands.getrole.giveRoles(settings, msg.member, robloxId);
      if (!res) {
        return msg.channel.sendSuccess(msg.author, {
          title: "Successfully verified",
          description: `There were no ranks to give you.\nRank data is cached for up to 10 minutes: Try using \`${prefix}getroles\` in a few minutes if you think you should have roles.`
        });
      } if (res.error) {
        return msg.channel.sendError(msg.author, {
          title: "Verified with errors",
          description: "Successfully verified you. I tried to fetch your roles, but encountered an error.",
          fields: [{
            name: "Error details",
            value: (res && res.error) || "No response from Fetch roles."
          }]
        });
      }
      res.title = `Verified and fetched roles`;
      res.description = `You have successfully verified your account!\n${res.description}`;
      return msg.channel.sendSuccess(msg.author, res);
    }

    if (aquariusResponse.error) {
      const { error } = aquariusResponse;
      if (error.status === 400) {
        // Code not found
        const {
          robloxId,
          robloxUsername
        } = error;
        return msg.channel.sendError(msg.author, `I couldn't find the code in your profile. Please ensure that it is in your **description** / **blurb**.\nUsername: \`${robloxUsername}\` UserID: \`${robloxId}\`\nIf still having difficulties, have a look at the [website](https://verify.neztore/dashboard)`);
      } if (error.status === 404) {
        // No link
        return msg.channel.sendError(msg.author, `You are not currently linking your account. Please use the \`linkaccount\` command, or head to the [website](https://verify.neztore/dashboard) to get a verification code.`);
      } if (error.status === 500) {
        // Roblox error
        return msg.channel.sendError(msg.author, `Roblox returned a temporary error. Please try again later.\n${error.message}`);
      }
      throw new Error(error.message);
    }
    throw new Error("Failed to check with Aquarius.");
  }
}

module.exports = doneCommand;
