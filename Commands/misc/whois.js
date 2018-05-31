var rbx = require('roblox-js')
let Polaris = require('../../util/client.js')

class whoisCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = "Tells you a user's ROBLOX Name"
    this.aliases = ['whomst', 'who']
    this.group = 'Roblox'
    this.guildOnly = true
  }
  async execute (msg) {
    if (!msg.mentions[0]) {
      return msg.channel.sendError(msg.author, 'You must mention a user.\nSupport for whois without tagging will be added in future.')
    }
    const mentionedUser = msg.mentions[0]
    if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**')

    var rbxId = await this.client.db.getLink(mentionedUser.id)
    if (!rbxId) {
      return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?")
    } else {
      let robloxName = null
      try {
        robloxName = await rbx.getUsernameFromId(rbxId)
      } catch (error) {
        console.log(rbxId)
        this.client.logError(error)
        return msg.channel.sendError(msg.author, {title: "Oops! That's an error", description: "I couldn't find that users name. Is ROBLOX down?"})
      }

      msg.channel.sendInfo(msg.author, {
        title: 'Player name',
        description: `That user is \`${robloxName}\`.`,
        url: `https://www.roblox.com/users/${rbxId}/profile`
      })
    }
  }
}
module.exports = whoisCommand
