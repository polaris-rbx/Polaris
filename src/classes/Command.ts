// note: CommandGroups[0] is "verification".
import { Constants, Message } from "eris";

const { Permissions: permissions } = Constants;

// not sure why this triggers the shadow rule: it isn't defined in the upper scope
// eslint-disable-next-line no-shadow
export enum CommandGroups {
  verification= 0,
  misc= 1,
  admin = 2
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
