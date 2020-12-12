const { readdirSync, statSync } = require("fs");
const { join } = require("path");

class CommandManager {
  constructor (client) {
    this.client = client;
    this.commands = { aliases: {} };

    this.prefix = ".";
    this.client.once("ready", () => this.prefixMention = new RegExp(`^<@!?${this.client.user.id}> `));

    this.loadCommands(join(__dirname, "../commands"));
  }

  loadCommands (directory) {
    const ignoredFiles = ["baseCommand.js", "index.js"];
    readdirSync(directory).forEach(file => {
      if (!ignoredFiles.includes(file)) {
        const stat = statSync(join(directory, file));

        if (stat.isFile()) {
          const commandFile = require(`${directory}/${file}`);
          const command = new commandFile(this.client);
          const commandName = file.replace(".js", "");
          command.name = commandName;
          command.url = `${directory}/${file}`;

          this.commands[commandName] = command;
          if (command.aliases) {
            command.aliases.forEach(alias => {
              this.commands.aliases[alias.toLowerCase()] = commandName;
            });
          }
        } else if (stat.isDirectory()) {
          this.loadCommands(join(directory, file));
        }
      }
    });
  }

  async processMessage (message) {
    if (message.author.bot || !message.author) return;
    if (message.channel.guild && (message.channel.guild.id === "264445053596991498" || message.channel.guild.id === "110373943822540800")) return; // Block Server List Guilds
    let prefix = ".";
    let prefixMsg = prefix;

    if (message.channel.guild) { // Handle Custom Prefix - It's in a guild.
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
    if (this.prefixMention) {
      if (message.content.match(this.prefixMention)) {
        prefix = message.content.match(this.prefixMention)[0];
        prefixMsg = `@${this.client.user.username}#${this.client.user.discriminator} `;
      }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    if (this.commands.aliases[command]) command = this.commands.aliases[command];

    if (this.commands[command]) {
      return this.commands[command].process(message, args, prefixMsg);
    }
  }
}

module.exports = CommandManager;
