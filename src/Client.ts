import * as Sentry from "@sentry/node";
import { ClientOptions, Client as ErisClient, Message } from "eris";

import { Command } from "./classes/Command";
import commands from "./commands";

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
    const parts = message.content.toLowerCase().split(" ");
    const command = parts.splice(1)[0].substr(prefix.length).toLowerCase();

    let cmdClass: typeof Command;
    for (const commandInfo of commands) {
      if (commandInfo.name === command) {
        cmdClass = commandInfo.command;
        break;
      } else if (commandInfo.aliases.includes(command)) {
        new commandInfo.command();
        break;
      }
    }
  }
}
