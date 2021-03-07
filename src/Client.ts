import * as Sentry from "@sentry/node";
import { ClientOptions, Client as ErisClient, Message } from "eris";

export default class Client extends ErisClient {
  constructor (opt: ClientOptions) {
    const { token } = process.env;
    if (!token) throw new Error("No bot token provided");
    super(token, opt);

    this.on("MessageCreate", this.handleMessage);
    this.on("error", this.handleError);
  }

  handleError (err: Error) {
    console.error(err);
    Sentry.captureException(err);
  }

  async handleMessage (message: Message) {
    // eslint-disable-next-line no-useless-return
    if (message.author.bot || !message.author) return;
  }
}
