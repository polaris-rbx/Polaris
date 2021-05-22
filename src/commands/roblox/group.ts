import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

export class GroupInfoCommand extends Command {
  info = groupInfo;

  async run (): Promise<any> {
    return "Retrieve group info - not implemented.";
  }
}

export const groupInfo: CommandInfo = {
  name: "group",
  description: "Retrieves information about a given group.",
  aliases: ["groupinfo", "getgroup", "ginfo"],
  group: CommandGroups.roblox,
  guildOnly: false,
  permissions: [],
  command: GroupInfoCommand
};
