const BaseCommand = require("../baseCommand");

class reloadCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Reloads a command file";
    this.group = "OWNER";
    this.hidden = true;
    this.guildOnly = false;
  }

  async execute (msg, args) {
    if (msg.author.id !== "183601072344924160") return;
    if (!args[0]) return msg.channel.sendError(msg.author, `Command name is required!`);
    let command = args[0];
    if (this.client.CommandManager.commands.aliases[command]) {
      command = this.client.CommandManager.commands.aliases[command];
    } else if (!this.client.CommandManager.commands[command]) {
      return msg.channel.sendError(msg.author, `Invalid command name!`);
    }
    delete require.cache[require.resolve(this.client.CommandManager.commands[command].url)];
    msg.channel.sendSuccess(msg.author, `Successfully reloaded the \`${command}\` command.`);
  }
}
module.exports = reloadCommand;
