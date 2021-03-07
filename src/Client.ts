import * as Sentry from "@sentry/node";
import {
  ClientOptions, Client as ErisClient, Message
} from "eris";
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
    if (message.author.bot || !message.author) return;

    // Work out prefix
    let prefix = ".";
    let prefixMsg = prefix;

    if ("guild" in message.channel) { // Handle Custom Prefix - It's in a guild.
      const { guild } = message.channel;
      let guildSettings = await this.client.db.getSettings(guild.id);
      if (!guildSettings) {
        console.log(`Guild ${guild.id} has no settings. Resolving.`);
        await this.client.db.setupGuild(guild);
        guildSettings = await this.client.db.getSettings(guild.id);
      }
      if (guildSettings.autoVerify) {
        this.client.autoRole(message.member);
      }
      if (guildSettings.prefix && guildSettings.prefix !== "") {
        prefix = guildSettings.prefix;
        prefixMsg = prefix;
      }
    }
  }
}
