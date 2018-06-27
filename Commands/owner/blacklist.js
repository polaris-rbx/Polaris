let Polaris = require('../../util/client.js')

class blacklistCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = 'Simple ping command to retrieve bot latency.'
    this.aliases = []
    this.group = 'OWNER'
    this.guildOnly = false
    this.hidden = true
  }
  async execute (msg, args) {
    if (msg.author.id !== this.client.ownerId) return
    var id = args[0]
    const reason = args[1]
    if (msg.mentions.length !== 0) id = msg.mentions[0].id
    if (!id) return msg.channel.sendError(msg.author, 'You must provide an ID to blacklist!')
    console.log(`ID: ${id} REASON: ${reason}`)
    const blacklist = this.client.db.blacklist
    if (id === this.client.ownerId) return msg.channel.sendError(msg.author, 'You cannot blacklist yourself!')
    if (await blacklist.get(id)) {
      console.log(`Updating blacklist for ${id}`)
      await blacklist.get(id).update({reason: reason, time: new Date()})
      msg.channel.sendSuccess(msg.author, 'Successfully updated the blacklist!\nNew reason: ' + reason)
    } else {
      console.log(`Creating blacklist for ${id}, reason: ${reason}`)
      await blacklist.insert({id: id, reason: reason, time: new Date()})
      msg.channel.sendSuccess(msg.author, 'Successfully added the blacklist!\n**Reason:** ' + reason)
    }
  }
}
module.exports = blacklistCommand
