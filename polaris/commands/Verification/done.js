const BaseCommand = require('../baseCommand');
const { getLink } = require("../../util/linkManager");

class doneCommand extends BaseCommand {
	constructor (client) {
		super(client);
		this.description = 'Completes an in-progress account link by checking your Roblox profile for the code.';
		this.aliases = ['ihavesuccessfullyputthecodeinmydesc'];
		this.group = 'Roblox account verification';
	}
	async execute (msg, a, prefix) {
		// Check if the user has an in-progress account link. If not, return error.
		if (!this.client.linkQueue.get(msg.author.id)) return msg.channel.sendError(msg.author, "I couldn't find an account link awaiting completion. Please ensure that you have used `.linkaccount [RobloxName]` and that it has not timed out.");
		// Define variables from the queue
		var queue = this.client.linkQueue.get(msg.author.id);
		const robloxUser = queue.robloxUser;
		var code = queue.code;

		var playerInfo = await robloxUser.updateInfo();
		if (playerInfo.error) {
			msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is Roblox Down?\n`' + playerInfo.error.message + '`'});
			if (playerInfo.error.status !== 404) this.client.logError(playerInfo.error);
			return;
		}

		let status = playerInfo.status;
		let description = playerInfo.blurb;

		// Search for code
		if (checkMatch(code, status, description)) {
			// The code matches, remove the entry from pending links.
			this.client.linkQueue.delete(msg.author.id);

			// Check for existing link and update

			if (await getLink(msg.author.id)) {
				await this.client.db.users.get(msg.author.id).update({
					robloxId: robloxUser.id

				}).run();
				return msg.channel.sendSuccess(msg.author, `You've successfully changed your account link! Please do \`${prefix}getroles\` to continue.\nNew Username: \`${robloxUser.username}\` UserID: \`${robloxUser.id}\``);
			}
			await this.client.db.users.insert({
				robloxId: robloxUser.id,
				discordId: msg.author.id

			}).run();
			const verified = await this.client.CommandManager.commands.getrole.verifiedRoles(true, msg.member);
			if (verified.error) {
				return msg.channel.sendError(msg.author, {
					title: "Permission error",
					description: verified.error
				})
			}

			const settings = await this.client.db.getSettings(msg.channel.guild.id);
			const res = await this.client.CommandManager.commands.getrole.giveRoles(settings, msg.member, robloxUser.id);
			if (!res) {
				return msg.channel.sendSuccess(msg.author, {
					title: "Successfully verified",
					description: `There were no ranks to give you.\nRank data is cached for up to 10 minutes: Try using \`${prefix}getroles\` in a few minutes if you think you should have roles.`
				})
			} else if (res.error) {
					return msg.channel.sendError(msg.author, {
						title: "Verified with errors",
						description: "Successfully verified you. I tried to fetch your roles, but encountered an error.",
						fields: [{
							name: "Error details",
							value: (res && res.error) || "No response from Fetch roles."
						}]
					})
				} else {
					res.title = `Verified and fetched roles`
					res.description = `You have successfully verified your account!\n${res.description}`
					return msg.channel.sendSuccess(msg.author, res);
				}
		} else {
			return msg.channel.sendError(msg.author, `I couldn't find the code in your profile. Please ensure that it is in your **description** / **blurb**.\nUsername: \`${robloxUser.username}\` UserID: \`${robloxUser.id}\``);
		}
	}
}

module.exports = doneCommand;

function checkMatch (code, status, description) {
	if (!code) return false;
	const lowered = code.toLowerCase();
	if (status && (status.toLowerCase().includes(lowered))) {
		return true;
	} else if (description) {
		return description.toLowerCase().includes(lowered);

	} else {
		return false;
	}
}
