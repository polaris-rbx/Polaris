// note: CommandGroups[0] is "verification".
import {
  Client,
  Constants, Member, Message, MessageContent, TextableChannel, User
} from "eris";

const { Permissions: permissions } = Constants;

// not sure why this triggers the shadow rule: it isn't defined in the upper scope
// eslint-disable-next-line no-shadow
export enum CommandGroups {
  verification = 0,
  misc = 1,
  admin = 2
}

export interface CommandInfo {
  name: string;

  description: string;

  // todo : make more precise
  permissions: (typeof permissions)[];

  aliases: string[];

  group: CommandGroups;

  guildOnly: boolean;

  command: typeof Command
}

export abstract class Command {
  client: Client

  channel: TextableChannel;

  abstract readonly info: CommandInfo;

  /**
   * The user that ran the command
   */
  user: User

  message: Message

  guildId?: string;

  /**
   * The member that ran the command. Use getMember to access.
   */
  member?: Member

  args: string[]

  constructor (client: Client, message: Message, args: string[]) {
    this.client = client;
    this.channel = message.channel;
    this.message = message;
    this.user = message.author;

    if (message.member) {
      this.member = message.member;
    }
    this.guildId = message.guildID;
    this.args = args;
  }

  abstract run (): Promise<MessageContent | void>;

  /**
   * Returns either the member of the user that ran this command, or the member of the user with id that you pass.
   * Uses the current guild of this command. Errors if running in DMs, and will attempt to fetch from Discord once
   * cahce fails. you should validate ids as much as possible before using this.
   * @param id (Optional) The id of the member to fetch. If not provided, fetches the member that ran the command.
   */
  async getMember (id?: string): Promise<Member> {
    if (!this.guildId) {
      throw new Error("Cannot get member: No guild id - in DM");
    }
    const memberId = id || this.user.id;

    if (this.member && this.member.id === memberId) {
      return this.member;
    }

    const server = this.client.guilds.get(this.guildId);
    if (server && server.members.has(memberId)) {
      const member = server.members.get(memberId);
      if (member) return member;
    }

    return this.client.getRESTGuildMember(this.guildId, memberId);
  }

  /**
   * Runs either the user that ran the command (author) or the user you supply. Fetches the user if they aren't in cache
   * @param id (Optional) The id of the user.
   */
  async getUser (id?: string): Promise<User> {
    if (!id) return this.user;
    if (id === this.user.id) return this.user;

    const user = this.client.users.get(id);
    if (user) return user;

    return this.client.getRESTUser(id);
  }

  getMessage (): Message {
    return this.message;
  }

  async reply (content: MessageContent) {
    const replyContent: MessageContent = typeof content === "string" ? { content } : content;

    replyContent.messageReference = {
      messageID: this.message.id,
      failIfNotExists: false
    };

    return this.client.createMessage(this.channel.id, replyContent);
  }
}
