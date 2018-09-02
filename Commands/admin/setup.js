let Polaris = require("../../util/client.js");
class setupCommand extends Polaris.command {
	constructor(client) {
		super(client);
		this.description =
			"Helps you to set up your server. Builds discord roles from your Group.";
		this.group = "Admin";
		this.permissions = ["administrator"];
		this.guildOnly = true;
	}
	async execute(msg, args) {
		const botMember = msg.channel.guild.members.get(this.client.user.id);
		if (!botMember.permission.has("manageRoles")) {
			return msg.channel.sendError(msg.author, {
				title: "I don't have permission!",
				description:
					"I don't have permission to create roles. Please grant me this and re-run the command."
			});
		}
		var groupId;
		if (args[0]) {
			if (!isNaN(args[0])) {
				groupId = args[0];
			}  // is NaN checks if NOT a number, so it is inverted.
		}
		const settings = await this.client.db.getSettings(msg.channel.guild.id);
		if (settings.mainGroup && settings.mainGroup.id && !groupId) {
			const res = await msg.channel.restrictedPrompt(
				msg.author,
				{
					title: "Do you want to use this Group id?",
					description: `The current Group Id in settings is \`${
						settings.mainGroup.id
					}\`. Do you want to use this, or a different one?`
				},
				["This one", "Different"]
			);
			if (!res) {
				return;
			} else if (res.content.toLowerCase() === "this one") {
				groupId = settings.mainGroup.id;
			}
		}
		if (!groupId) {
			// Get new group ID
			const newId = await msg.channel.prompt(msg.author, {
				title: "What group ID Do you want to use?",
				description:
					"What group id do you want to use? This is the group which I will fetch ranks from."
			});
			if (!newId) return;
			if (isNaN(newId.content))
				return msg.channel.sendError(msg.author, `Group id must be a number!`);
			groupId = newId.content;
		}
		const group = await this.client.roblox.getGroup(groupId);
		if (group.error) {
			msg.channel.sendError(msg.author, {
				title: "HTTP Error",
				description: `Oops! Error.\`\`\`${group.error.message}\`\`\``
			});
			throw new Error(group.error);
		}
		const msgToBeEdited = await msg.channel.send(
			"Generating roles.. Please wait."
		);
		if (!msgToBeEdited) return;
		
		const roles = group.roles.reverse();
		var createdRoles = "";
		for (var current of roles) {
			// Check for role with same name.
			if (!msg.channel.guild.roles.find(a => a.name === current.Name)) {
				await msg.channel.guild.createRole({ name: current.Name },`Set-up command run by ${msg.author.username}#${msg.author.discriminator}`
				);
				createdRoles = `${createdRoles}**-** ${current.Name}\n`;
			}
		}
		if (createdRoles === "") {
			msgToBeEdited.edit({
				content: `<@${msg.author.id}>`,
				embed: {
					title: "No roles to make!",
					color: 0xb3000a,
					timestamp: new Date(),
					description:
						"There were no roles to create.\nIf there is already a discord role with the same name, I will not create another role with that name."
				}
			});
			return;
		}
		msgToBeEdited.edit({
			content: `<@${msg.author.id}>`,
			embed: {
				title: "Created the following roles!",
				description: createdRoles,
				color: 0x23ff9f,
				timestamp: new Date(),
				fields: [
					{
						name: "Missing role?",
						value: "If a role with a rank name already exists, the bot will not create a new one."
					},
					{
						name: "What next?",
						value: "You can now colour and order them as you please. Permissions are default."
					}
				]
			}
		});
	}
}
module.exports = setupCommand;
