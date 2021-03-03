const BaseCommand = require("../baseCommand");

const settings = require("../../../settings.json");



const { specialPeople } = settings;

const { getLink } = require("../../util/linkManager");



class getinfoCommand extends BaseCommand {

  constructor (client) {

    super(client);

    this.description = "Retrieves the Roblox information of a user from a discord userid.";

    this.aliases = ["whois"];

    this.group = "Roblox";

    this.guildOnly = true;

  }



  async execute (msg, args) {

    let robloxUser;



    let mentionedUser;



    if (msg.mentions.length === 0) {

      // Isn't a mention

      if (args.length !== 0) {

        const findStr = args.join(" ").toLowerCase();

        const user = msg.channel.guild.members.find(member => member.username.toLowerCase().startsWith(findStr));

        const userTwo = msg.channel.guild.members.get(args[0]);

        if (user) {

          mentionedUser = user;

        } else if (userTwo) {

          mentionedUser = userTwo;

        } else if (args[0]) {

          robloxUser = await this.client.roblox.getUserFromName(args[0]);

        }

      }

    } else {

      mentionedUser = msg.mentions[0];

    }



    if (!robloxUser) {

      mentionedUser = mentionedUser || msg.author;

      if (mentionedUser.bot) return msg.channel.sendError(msg.author, "Do you really think a bot has linked their account?! **Please mention a normal user!**");

      const rbxId = await getLink(mentionedUser.id);

      if (!rbxId) {

        return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?");

      }

      robloxUser = await this.client.roblox.getUser(rbxId);

