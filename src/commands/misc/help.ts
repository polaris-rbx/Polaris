import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

export class HelpCommand extends Command {
  info = helpInfo;

  async run (): Promise<any> {
    return "Help command - to be implemented.";
  }
}

export const helpInfo: CommandInfo = {
  name: "help",
  description: "Displays a list of available commands.",
  aliases: [],
  group: CommandGroups.misc,
  guildOnly: false,
  permissions: [],
  command: HelpCommand
};
