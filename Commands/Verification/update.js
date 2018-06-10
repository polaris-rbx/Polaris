'use strict'
let Polaris = require('../../util/client.js')

class updateRoleCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = "Uses a previously linked account and a server's settings to a user their roles according to your group rank(s)."
    this.aliases = ['updateRole', 'updateRoles']
    this.group = 'Roblox account verification'
    this.permissions = ['manageRoles']
    this.guildOnly = true
  }
  async execute (msg) {
    // Check for link
    if (!msg.mentions[0]) {
      return msg.channel.sendError(msg.author, 'You must mention a user.\nSupport for updateroles without tagging will be added in future.')
    }
    const mentionedUser = msg.mentions[0]
    const mentionedMember = msg.channel.guild.members.get(mentionedUser.id)
    if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**')

    var rbxId = await this.client.db.getLink(mentionedUser.id)
    if (!rbxId) {
      return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?")
    }

    // Check for settings

    var settings = await this.client.db.getSettings(msg.member.guild.id)
    if (!settings || (settings.binds.length === 0 && !settings.mainGroup.ranksToRoles)) {
      msg.channel.sendError(msg.author, {title: 'No settings', description: "This server isn't set up yet. Please ask an admin to set up Polaris."})
      return
    }

    const reply = await this.client.commands.getrole.giveRoles(settings, mentionedMember, rbxId)
    if (reply) {
      reply.title = 'Changed their roles:'

      msg.channel.sendSuccess(msg.author, reply)
    } else {
      msg.channel.sendError(msg.author, 'I could not find any roles to give or remove from `' + mentionedUser.username + '`.')
    }
  }
}
module.exports = updateRoleCommand
