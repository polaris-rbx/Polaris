const quoteEngine = require("polaris-quote-engine");

const BaseCommand = require("../baseCommand");

class quoteCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Produces a random quote from a person of great wisdom.";
    this.group = "Fun";
    this.guildOnly = false;
  }

  async execute (msg) {
    const text = quoteEngine();
    msg.channel.sendInfo(msg.author, {
      title: " ",
      author: { name: text[1] },
      description: `:scroll: ${text[0]}`
    });
  }
}
module.exports = quoteCommand;
