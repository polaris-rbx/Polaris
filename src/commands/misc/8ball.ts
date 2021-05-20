import { Command, CommandGroups, CommandInfo } from "../../classes/Command";

const good = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes"];
const none = ["Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again"];
const bad = ["Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"];

export class EightballCommand extends Command {
  info = eightballInfo;

  async run (): Promise<any> {
    // First decide whether it is is a 'good', 'bad' or 'neutral' outcome.
    const roll = Math.floor(Math.random() * 3);

    if (roll === 0) {
      return `:8ball: ${this.selectOption(good)}`;
    }
    if (roll === 1) {
      return `:8ball: ${this.selectOption(bad)}`;
    }

    return `:8ball: ${this.selectOption(none)}`;
  }

  selectOption (arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

export const eightballInfo: CommandInfo = {
  name: "8ball",
  description: "A magic 8ball. Pretty simple, right?",
  aliases: ["ball", "eightball"],
  group: CommandGroups.misc,
  guildOnly: false,
  permissions: [],
  command: EightballCommand
};
