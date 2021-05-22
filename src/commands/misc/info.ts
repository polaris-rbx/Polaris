import { User } from "eris";

import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

export class InfoCommand extends Command {
  info = infoInfo;

  async run (): Promise<any> {
    const user: User = await this.getUser();
    const dmChannel = await user.getDMChannel();
    const embed = {
      title: "Bot info",
      description: "Insert bot info here ok"
    };
    try {
      await dmChannel.createMessage({ embed });
    } catch (err) {
      // Can't DM - Just reply instead.
      await this.reply({ embed });
    }
  }
}

export const infoInfo: CommandInfo = {
  name: "info",
  description: "Retrieves information about the bot",
  aliases: ["invite", "botinfo"],
  group: CommandGroups.misc,
  guildOnly: false,
  permissions: [],
  command: InfoCommand
};
