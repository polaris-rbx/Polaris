import { Message } from "eris";

import { Command, CommandGroups } from "../../classes/Command";

export default class PingCommand implements Command {
  aliases: ["pong"];

  description: "";

  group: CommandGroups.misc;

  guildOnly: boolean;

  name: "ping";

  permissions: []

  run (msg: Message, args: string[]): Promise<any> {
    return Promise.resolve(undefined);
  }
}
