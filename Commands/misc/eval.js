let Polaris = require('../../util/client.js')

class evalCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = 'EVAL COMMAND. OWNER ONLY. YOU SHOULD NOT BE ABLE TO SEE THIS.'
    this.group = 'OWNER'
    this.hidden = true
    this.guildOnly = false
  }
  async execute (msg, string) {
    if (msg.author.id !== '183601072344924160') return
    console.log(`EVAL RAN BY ${msg.author.username}! User ID: ${msg.author.id}`)
    try {
      const code = string.join(' ')
      let evaled = eval(code)

      if (typeof evaled !== 'string') {
        evaled = require('util').inspect(evaled)
      }
      if (evaled.length > 2040) evaled = evaled.substring(0, 2035) + '**...**'
      msg.channel.sendInfo(msg.author, {title: 'Eval complete', description: '```' + evaled + '```'})
    } catch (err) {
      msg.channel.sendError(msg.author, {description: `\`\`\`xl\n${clean(err)}\n\`\`\``})
    }
  }
}
module.exports = evalCommand

function clean (text) {
  if (typeof text === 'string') {
    return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
  } else {
    return text
  }
}
