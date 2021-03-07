import eris, { Message } from "eris";

declare module "eris" {
  class TextChannel extends eris.TextChannel {
    send(msg: string): Promise<Message>
  }
}

eris.TextChannel.prototype.send = function send (msg: string) {
  return new Message();
};
