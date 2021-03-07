import eris from "eris";

declare module "eris" {
  class Message extends eris.Message {
    reply(msg: string): Promise<eris.Message>
  }
}

// note: is this a good idea? 'reply' might be used by an upstream method in future.
eris.Message.prototype.reply() = function reply () {
  return undefined;
};
