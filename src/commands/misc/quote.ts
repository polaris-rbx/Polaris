// @ts-ignore - its 1 function, no point in making up a declaration
import generateQuote from "polaris-quote-engine";

import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

export class QuoteCommand extends Command {
  info = quoteInfo;

  async run (): Promise<string> {
    const quote: string[] = generateQuote();
    return `${quote[0]}\n\t**~${quote[1]}**`;
  }
}

export const quoteInfo: CommandInfo = {
  name: "quote",
  description: "Produces a random quote from a person of great wisdom.",
  aliases: [""],
  group: CommandGroups.misc,
  guildOnly: false,
  permissions: [],
  command: QuoteCommand
};
