import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

export class WhoisCommand extends Command {
  info = whoisInfo;

  async run (): Promise<any> {
    return "Whois Command: Not implemented";
  }
}

export const whoisInfo: CommandInfo = {
  name: "whois",
  description: "Retrieves Roblox user information about a given Discord user, or Roblox account.",
  aliases: ["who", "getinfo", "uinfo", "getlink", "identify"],
  group: CommandGroups.roblox,
  guildOnly: false,
  permissions: [],
  command: WhoisCommand
};
