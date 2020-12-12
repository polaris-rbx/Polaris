const packageJson = require("../../../package.json");
const BaseCommand = require("../baseCommand");

class InfoCommand extends BaseCommand {
  constructor (client) {
    super(client);
    this.description = "Get information about the bot, and some important links.";
    this.aliases = ["invite", "support"];
    this.group = "Misc";
    this.guildOnly = false;
  }

  async execute (msg, _a, prefix) {
    let upTime = Math.round(this.client.uptime / 60000);
    let suffix = "Minutes";
    if (upTime > 60) {
      // It's > hr
      upTime /= 60;
      upTime = Math.round(upTime * 10) / 10;
      suffix = "Hours";
    } else if (upTime > 1440) {
      upTime /= 1440;
      upTime = Math.round(upTime * 10) / 10;
      suffix = "Days";
    }
    msg.channel.sendInfo(msg.author,
      {
        title: "Bot information",
        description: `**Polaris** is a Roblox verification bot created by \`Neztore#6998\`. The bot is always undergoing improvement. \nCurrent version: ${packageJson.version}\nPolaris is open source.`,
        timestamp: new Date(),
        fields: [
          {
            name: "Bot info",
            value: `Polaris was created by Neztore. It is written in Node.js, and recently became open source. If you wish to view the bot commands, please do \`${prefix}help\`.`
          },
          {
            name: "Our website",
            value: "Polaris now has a website, with our terms of use and commands. By using the bot, you agree to our [terms of use](https://polaris-bot.xyz/terms). You can see our site [here](https://polaris-bot.xyz/)."
          },
          {
            name: "Github",
            value: "You can snoop, fork, edit and contribute to the source code here:\n - [Bot](https://github.com/Neztore/Polaris)\n - [Website](https://github.com/Neztore/Polaris-React)"
          },
          {
            name: "Discord invite",
            value: "For support, join our [discord](https://discord.gg/QevWabU). This is also where you can make suggestions."
          },
          {
            name: "Bot invite",
            value: "To invite the bot to your server, use [this](https://discordapp.com/oauth2/authorize?client_id=375408313724043278&scope=bot&permissions=470281408) link."
          },
          {
            name: "Donate",
            value: "Do you enjoy using Polaris? Please donate to the running of the bot [here](https://www.paypal.me/Neztore)."
          },
          {
            name: "Discord bot list",
            value: "Why not check us out on [Discord bot list](https://discordbots.org/bot/375408313724043278)? You can also vote for Polaris, but we don't mind!"
          },
          {
            name: "Servers",
            value: this.client.guilds.size,
            inline: true
          },
          {
            name: "Uptime",
            value: `${upTime} ${suffix}`,
            inline: true
          },

        ]
      });
  }
}
module.exports = InfoCommand;
