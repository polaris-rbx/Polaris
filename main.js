'use strict'
const settings = require('./settings.json')

const Raven = require('raven')
Raven.config(settings.sentry, {
  captureUnhandledRejections: true,
  autoBreadcrumbs: true,
  sendTimeout: 3
}).install()

const Polaris = require('./util/client.js')
const client = new Polaris.Client(settings.token, Raven, {maxShards: 'auto'})

const probe = require('pmx').probe()

const DBL = require('dblapi.js')
const dbl = new DBL(settings.dblToken, client) // eslint-disable-line

// Raven error catcher, for anything that isn't caught normally. Shouldn't really be used.
Raven.context(function () {
  var accountLinks = 0
  async function updateValues () {
    accountLinks = await client.db.users.count().run()
  }
  setInterval(updateValues, 600000)
  updateValues()

  probe.metric({
    name: 'Account links',
    value: function () {
      return accountLinks
    }
  })

  probe.metric({
    name: 'Guilds',
    value: function () {
      return client.guilds.size
    }
  })

  client.on('ready', () => {
    console.log(`Bot now running on ${client.guilds.size} servers`)
    client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3})
  })

  // Fires when the bot joins a new guild. This updates the status and logs it.
  client.on('guildCreate', async guild => {
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
    client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3})
  })

  client.on('guildDelete', async guild => {
    console.log(`Guild ${guild.name} has removed Polaris.`)
    client.editStatus('online', {name: `${client.guilds.size} servers | .help`, type: 3})
  })

  client.on('guildMemberAdd', async function (guild, member) {
    if (member.bot) return
    const settings = await client.db.getSettings(guild.id)
    if (settings.autoVerify) {
      var rbxId = await client.db.getLink(member.id)
      if (settings && rbxId) {
        var res = await client.commands.getrole.giveRoles(settings, member, rbxId)
        if (res) {
          if (res.error) return // If errors, fail silently. No need for user to see.
          res.title = 'Welcome to ' + guild.name
          var DMChannel = await member.user.getDMChannel()
          DMChannel.sendSuccess(member.user, res)
        }
      } else if (!rbxId) {
        await client.commands.getrole.verifiedRoles(false, member)
      }
    }
  })
  client.on('messageCreate', async (message) => {
    // Command handler
    if (message.author.bot) return
    // New prefix handler
    const prefixMention = new RegExp(`^<@!?${client.user.id}> `)
    let prefix = '.'
    // Check if user has mentioned bot. if so, set that to prefix. Else, check for custom prefix.
    if (message.content.match(prefixMention)) {
      prefix = message.content.match(prefixMention)[0]
    } else {
      const guild = message.channel.guild

      if (guild) {
        const guildSettings = await client.db.getSettings(guild.id)
        // it is in a server. Check if they have a custom prefix. If so set prefix to it.
        if (guildSettings.prefix && guildSettings.prefix !== '') {
          prefix = guildSettings.prefix
        }
      }
    }
    if (!message.content.startsWith(prefix)) return

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    // Main command handler. For commands used with the main 'alias'
    if (client.commands[command]) {
      client.commands[command].process(message, args)
      // Run if its using an alias
    } else if (client.commands.aliases[command]) {
      client.commands[client.commands.aliases[command]].process(message, args)
    }
  })
}) // Ends context
