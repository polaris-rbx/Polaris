let Polaris = require('../../util/client.js')

class linkAccountCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = 'Creates an account link to allow for role retrieval.'
    this.aliases = ['verify', 'link', 'relink']
    this.group = 'Roblox account verification'
  }
  async execute (msg, args) {
    // If no username, prompt for it.
    var username = args[0]
    if (!username) {
      // Prompt for username
      var rbxMsg = await msg.channel.prompt(msg.author, 'You need to provide your ROBLOX username. What is your ROBLOX username?')
      if (!rbxMsg) return
      username = rbxMsg.content
    }

    // ROBLOX NAME VALIDATION
    if (searchForChars(username, ['?', '<', '>', '~', '|', '%', '"'])) return msg.channel.sendError(msg.author, 'ROBLOX usernames may only contain letters, numbers or the _ symbol.')
    // Get ROBLOX userID from username, return error if not existing. Check that error is non-existant user error.
    const robloxUser = await this.client.roblox.getUserFromName(username)
    if (robloxUser.error) {
      if (robloxUser.error.status === 404) return msg.channel.sendError(msg.author, {title: 'User not found', description: `I could not find user \`${username}\` on ROBLOX.`})
      msg.channel.sendError(msg.author, {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + robloxUser.error.message + '`'})
      return this.client.logError(robloxUser.error)
    }
    // ALREADY EXIST CHECK
    var current = await this.client.db.users.get(msg.author.id)
    if (current) {
      var user = robloxUser.username

      var opt = await msg.channel.restrictedPrompt(msg.author, {title: 'Are you sure you wish to continue?', description: `Continuing will over-write your current link with user \`${user}\` and ID \`${current.robloxId}\`.\nDo you wish to continue?`}, ['Yes', 'No'])
      if (!opt) return
      if (opt.content.toLowerCase() !== 'yes') return msg.channel.sendInfo(msg.author, 'Cancelled account re-linking.')
    }

    // Generate code, add to queue and return it.
    // Remove any old link attempts from queue
    if (this.client.linkQueue.get(msg.author.id)) this.client.linkQueue.delete(msg.author.id)

    let code = generateCode()
    msg.channel.sendInfo(msg.author, {
      title: 'Account link code',
      description: `You are linking account with account \`${username}\` with UserID \`${robloxUser.id}\`.\nPlease place the following code in your ROBLOX profile - It can be in your ROBLOX status or description - do \`.done\` once it is there.\n**This request will time-out after five minutes**\n\`${code}\``
    })

    this.client.linkQueue.set(msg.author.id, {
      robloxUser: robloxUser,
      code: code
    })
    var linkQueue = this.client.linkQueue
    setTimeout(function () {
      if (linkQueue.get(msg.author.id)) { linkQueue.delete(msg.author.id) }
    }, 300000)
  }
}
module.exports = linkAccountCommand

function searchForChars (string, chars) {
  var arr = string.split('')
  for (var count in arr) {
    if (chars.includes(arr[count])) {
      return true
    }
  }
  return false
}

function generateCode () {
  const safeWords = [
    'weather', 'hello', 'roblox', 'favorite', 'eating', 'chocolate', 'cheese', 'tasty', 'help', 'general', 'know', 'baby', 'dolly',
    'graphics', 'super', 'intense', 'disruption', 'beautiful', 'happy', 'angry', 'excited', 'hard', 'soft',
    'puppy', 'dogs', 'cats', 'meow', 'woof', 'like', 'enjoyable', 'hamster', 'tiger', 'bear', 'guinea', 'pig', 'aardvark', 'sea', 'lion', 'chinchilla',
    'otter', 'goat', 'skunk', 'armadillo', 'oats', 'beans', 'tomatos', 'onions', 'oranges'
  ]

  var words = ''

  for (var i = 0; i < 5; i++) {
    words += ` ${safeWords[Math.floor(Math.random() * safeWords.length)]}`
  }

  words = words.slice(1)
  return words
}
