import * as Sentry from "@sentry/node";
import { ClientOptions, Client as ErisClient, Message } from "eris";

import InputError from "./classes/Errors";
import mappedCommands from "./commands";

export default class Client extends ErisClient {
  constructor (token: string, opt?: ClientOptions) {
    super(token, opt);

    this.on("messageCreate", this.handleMessage);
    this.on("error", this.handleError);
  }

  handleError (err: Error) {
    console.error(err);
    Sentry.captureException(err);
  }

  async handleMessage (message: Message) {
    if (message.author.bot || !message.author) return;
    // todo: prefix - customisable/ping
    const prefix = ".";

    // Parse arguments etc.
    const parts = message.content.slice(prefix.length).trim().split(/ +/g);
    const rawCommand = parts.shift();
    if (!rawCommand) return;

    const command = rawCommand.toLowerCase();

    // Check if it is a command
    if (mappedCommands[command]) {
      // Run the command
      try {
        const cmd = new mappedCommands[command](this, message);
        const resp = await cmd.run();

        if (resp) {
          await cmd.reply(resp);
        }
      } catch (err) {
        if (err instanceof InputError) {
          await message.channel.createMessage(`Error! (todo: refine this error): ${err.message}`);
        }
      }
    }
  }
}
