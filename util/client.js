// Require dependencies
var Eris = require('eris')
var erisExtensions = require('./erisExtensions.js')

var DB = require('./db.js')
const Collection = require('./Collection.js')

const path = require('path')
const fs = require('fs')

const PolarisRbx = require('./polaris-rbx')
const util = require('util')

// Add on additions to Eris prototypes (Such as awaitMessages or channel.sendInfo)
erisExtensions(Eris)

// COMMAND CLASS, BASE CLASS FOR ALL COMMANDS.
class Command {
  constructor (client) {
    this.client = client
    this.name = `Unidentified command`
    this.description = 'This command does not have a description'
    this.group = 'Unidentified'
    this.permissions = []
    this.aliases = []
    this.guildOnly = true

    // add some placeholders
  }

  async process (message, args) {
    if (!message.author) {
      message.channel.send(`:exclamation: \`message.author\` is not defined. This should not happen.\nError recorded. I'll get right on it!`)
      throw new Error('No author!')
    }

    // DM allowed check
    if (!message.channel.guild) {
      // In DMs
      if (this.permissions.length !== 0 || this.guildOnly) return message.channel.sendError(message.author, 'That command is guild only!')
    } else {
      // In a guild, check for message.member.
      if (!message.member) {
        console.log('No member ' + message.author.username)
        await getMembers(message.channel.guild)
        if (!message.author) {
          this.client.createMessage(message.channel.id, ":exclamation: I couldn't get your guild member. Please re-try this command. :exclamation:")
          throw new Error('Guild member is still not defined!')
        } else if (message.channel.guild.members.get(message.author.id)) {
          console.log('get author')
          message.member = message.channel.guild.members.get(message.author.id)
        }
      }
    }

    if (message.author.bot) return

    for (var counter in this.permissions) {
      if (!message.member.permission.has(this.permissions[counter])) {
        return message.channel.sendError(message.author, {title: 'Error', description: `The \`${this.name}\` command requires permission \`${this.permissions[counter]}\` permission`})
      }
    }

    if (!message.member && this.guildOnly) {
      console.log('MEMBER IS NULL. Content: ' + message.content + ' id: ' + message.id)
      return message.channel.sendError(message.author, "I couldn't find your guildMember. Please switch to `Online`, `Idle` or `DnD`. If issue persists, join our discord.")
    }
    // Add in some useful info for bug tracking
    this.client.Raven.setContext({
      user: {
        username: message.author.username,
        discriminator: message.author.discriminator,
        ID: message.author.id
      }
    })

    try {
      let commandName = this.name
      this.client.Raven.setContext({
        extra: {
          args: args,
          command: commandName
        }
      })

      this.execute(message, args)
    } catch (e) {
      this.client.Raven.captureException(e)
      console.log('COMMAND GENERAL CATCH: ' + e)
    }
  }
}
module.exports.command = Command

// CLIENT CLASS, BASE CLIENT CLASS.
module.exports.Client = class Client extends Eris.Client {
  constructor (token, Raven, options) {
    super(token, options)
    // Provide RAVEN and Eris libs
    this.Raven = Raven
    this.eris = Eris
    // Provides DB
    this.db = new DB(this)
    // For linkaccount and done.
    this.linkQueue = new Collection()
    // Roblox lib
    this.roblox = new PolarisRbx(this)

    this.start()
  }
  // Assemble commands and prepare the bot.
  start () {
    // Load commands and assemble aliases
    this.commands = {
      aliases: {}
    }
    let lib = this.commands
    let initClient = this
    function search (dir) {
      fs.readdirSync(dir).forEach(function (file) {
        var stat = fs.statSync(path.join(dir, file))
        if (stat.isFile()) {
          let CmdFile = require(dir + '/' + file)
          let command = new CmdFile(initClient)
          let CMDName = file.replace('.js', '')
          command.name = CMDName

          lib[CMDName] = command
          for (var i in command.aliases) {
            let alias = command.aliases[i].toLowerCase()
            lib.aliases[alias] = CMDName
          }
        } else if (stat.isDirectory()) {
          search(path.join(dir, file))
        }
      })
    }
    search(path.join(__dirname, '/../Commands'))
    // start bot

    this.connect()
  }
  // Interfaces for channels. Fills empty fields in embeds and sends.

  logError (err, obj) {
    this.Raven.mergeContext({
      extra: obj
    })
    console.log(err)
    if (typeof err === 'object') err = util.inspect(err)
    this.Raven.captureException(err)
  }
}

// async poly fill
async function getMembers (guild) {
  guild.fetchAllMembers()
}
