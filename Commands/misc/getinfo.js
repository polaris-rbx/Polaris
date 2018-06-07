
let Polaris = require('../../util/client.js')

class getinfoCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = 'Retrieves the ROBLOX information of a user.'
    this.aliases = []
    this.group = 'Roblox'
    this.guildOnly = true
  }
  async execute (msg) {
    if (!msg.mentions[0]) {
      return msg.channel.sendError(msg.author, 'You must mention a user.\nSupport for getinfo without tagging will be added in future.')
    }
    const mentionedUser = msg.mentions[0]
    if (mentionedUser.bot) return msg.channel.sendError(msg.author, 'Do you really think a bot has linked their account?! **Please mention a normal user!**')

    var rbxId = await this.client.db.getLink(mentionedUser.id)
    if (!rbxId) {
      return msg.channel.sendError(msg.author, "I couldn't find that user's info. Have they linked their account?")
    } else {
      const robloxUser = await this.client.roblox.getUser(rbxId)
      if (robloxUser.error) {
        msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + robloxUser.error.message + '`'})
        return this.client.logError(robloxUser.error)
      }

      var sentMsg = await msg.channel.sendInfo(msg.author, 'Getting user info... please wait.')
      if (!sentMsg) return // No perm to send msg.
      var playerInfo = await robloxUser.getInfo()
      if (playerInfo.error) return sentMsg.edit({embed: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + playerInfo.error.message + '`', timestamp: new Date(), color: 0xb3000a}})

      var joinDate = playerInfo.joinDate
      const date = `${(joinDate.getDate())}/${(joinDate.getMonth() + 1)}/${(joinDate.getFullYear())} (D/M/Y)`
      var text = `**Username:** ${playerInfo.username}\n**User ID:** ${rbxId}\n**Join date**: ${date}\n**Player age:** ${playerInfo.age}\n**Player status:** "${playerInfo.status}"`
      if (playerInfo.blurb.length <= 200) {
        text = `${text}\n**Blurb:** ${playerInfo.blurb}`
      } else {
        text = `${text}\n**Blurb:** ${playerInfo.blurb.substring(0, 200)}**...**`
      }
      sentMsg.edit({embed: {
        title: 'Player info',
        description: text,
        url: `https://www.roblox.com/users/${rbxId}/profile`,
        thumbnail: {
          url: 'https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId=' + rbxId,
          height: 100,
          width: 100
        },
        timestamp: new Date(),
        color: 0x03b212
      }})
    }
  }
}
module.exports = getinfoCommand
