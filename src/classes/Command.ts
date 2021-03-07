// note: CommandGroups[0] is "verification".
import { Constants, Message } from "eris";

const { Permissions: permissions } = Constants;

export enum CommandGroups {
  verification,
  misc,
  admin
}

export interface Command {
  name: string;
  description: string;
  // todo : make more precise
  permissions: (typeof permissions)[];
  aliases: string[];
  group: CommandGroups;
  guildOnly: boolean;

  run (msg: Message, args: String[]): Promise<any>;
}
