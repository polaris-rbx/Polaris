import * as Sentry from "@sentry/node";
import { ClientOptions, Client as ErisClient, Message } from "eris";
import "./util/erisExtensions";

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
    if (message.content.toLowerCase() === "aaa") {
      await message.reply("Hello :)");
    }
  }
}
