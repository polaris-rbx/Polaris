let Polaris = require('../../util/client.js');

class doneCommand extends Polaris.command {
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
			if (await this.client.db.getLink(msg.author.id)) {
				console.log('Updating for user ' + msg.author.username);
				await this.client.db.users.get(msg.author.id).update({
					robloxId: robloxUser.id

				}).run();
				return msg.channel.sendSuccess(msg.author, `You've successfully changed your account link! Please do \`${prefix}getroles\` to continue.\nNew Username: \`${robloxUser.username}\` UserID: \`${robloxUser.id}\``);
			}
			console.log('Inserting for user ' + msg.author.username);
			await this.client.db.users.insert({
				robloxId: robloxUser.id,
				discordId: msg.author.id

			}).run();
			const res = await this.client.commands.getrole.verifiedRoles(true, msg.member);
			const embed = {
				title: 'Account linked!',
				description: `You've successfully linked your account! Please do \`${prefix}getroles\` to continue, and recieve your roles.\nUsername: \`${robloxUser.username}\` UserID: \`${robloxUser.id}\``
			};
			if (res.error) {
				embed.fields = [
					{name: 'Permission error',
						value: `${res.error}`}
				];
			}
			return msg.channel.sendSuccess(msg.author, embed);
		} else {
			return msg.channel.sendError(msg.author, `I couldn't find the code in your profile. Please ensure that it is in your **status** or **description**.\nUsername: \`${robloxUser.username}\` UserID: \`${robloxUser.id}\``);
		}
	}
}

module.exports = doneCommand;

function checkMatch (code, status, description) {
	if (status === code) {
		return true;
	} else if (description) {
		if (description.includes(code)) return true;
	} else {
		return false;
	}
}
