// Assembles all commands into a single object which can be assessed using either command name or command aliases
// as the key. These are made lowercase for consistency.

import { CommandInfo } from "../classes/Command";
import { eightballInfo } from "./misc/8ball";
import { pingInfo } from "./misc/ping";
import { quoteInfo } from "./misc/quote";

// maps command names/aliases to the command classes
// tried to avoid 'any' but i could not get around the fact Command is technically abstract, so can't be instantiated -
// even though we never pass Command itself, only a subclass.
export interface CommandMapping {
  [nameOrAlias: string]: any
}

// Main commands list
const commands: CommandInfo[] = [pingInfo, eightballInfo, quoteInfo];

const mappedCommands: CommandMapping = {};

// Populate command mappings
for (const cmd of commands) {
  // Add mapping for command name
  mappedCommands[cmd.name.toLowerCase()] = cmd.command;

  // Add mappings for aliases
  for (const alias of cmd.aliases) {
    mappedCommands[alias.toLowerCase()] = cmd.command;
  }
}

export default mappedCommands;
