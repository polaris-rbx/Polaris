const { readdirSync, statSync } = require('fs');
const { join } = require('path');

class CommandManager {
  constructor(client) {
    this.client = client;
    this.commands = {
      aliases: {}
    }

    this.prefix = '.'
    this.prefixMention = new RegExp(`^<@!?${this.client.user.id}> `);
    this.loadCommands(join(__dirname, '/../commands'))
  }

  loadCommands(directory) {
    readdirSync(directory).forEach(file => {
      let stat = statSync(join(directory, file));
      if (stat.isFile()) {
        let commandFile = require(`${directory}/${file}`);
        let command = new commandFile(this.client);
        let commandName = file.replace('.js', '');
        command.name = commandName;
        command.url = `${directoriy}/${file}`;

        this.commands[commandName] = command;
        if (command.aliases) {
          command.aliases.forEach(alias => {
            this.commands.aliases[alias.toLowerCase()] = commandName;
          });
        };
      } else if (stat.isDirectory()) {
        this.loadCommands(join(directory, file))
      }
    })
  }

  async processMessage(message) {
    if (message.author.bot || !message.author) return;
    if (message.channel.guild && (message.channel.guild.id === '264445053596991498' || message.channel.guild.id === '110373943822540800')) return; // Block Server List Guilds

    // TODO: Do AutoRoling?	client.autoRole(message.member);
    let prefixMsg = prefix;

    if (message.channel.guild) { // Handle Custom Prefix
      let guild = message.channel.guild
      let guildSettings = await this.client.db.getSettings(guild.id);
      if (!guildSettings) {
        console.log(`Guild ${guild.id} has no settings. Resolving.`);
        await client.db.setupGuild(guild);
        guildSettings = await this.client.db.getSettings(guild.id);
      };

      if (guildSettings.prefix && guildSettings.prefix !== '') {
        prefix = guildSettings.prefix;
        prefixMsg = prefix;
      }
    }

    if (message.content.match(prefixMention)) {
      prefix = message.content.match(prefixMention)[0];
      prefixMsg = `@Polaris#9752 `;
    }
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (this.commands.aliases[command]) command = this.commands.aliases[command];

    if (this.commands[command]) {
      return this.commands[command].process(message, args, prefixMsg)
    }
  }
}

module.exports = CommandManager