let Polaris = require('../../util/client.js')

class helpCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.group = 'Misc'
    this.description = "Displays help page and all of Polaris' Commands"
    this.aliases = ['cmds', 'commands']
    this.guildOnly = false
  }
  async execute (msg, args) {
    var DMChannel = await msg.author.getDMChannel()
    if (args[0]) {
      // Provide specific help info
      let command = this.client.commands[args[0]] || this.client.commands[this.client.commands.aliases[args[0]]]
      if (!command) {
        if (!this._assembled) this.assemble()

        await DMChannel.sendInfo(msg.author, this._assembled)

        return
      }
      if (command.hidden) return // It's a hidden command. It doesn't exist.
      // assemble command-specific help
      let obj = {}
      // Add in command desc & command group
      obj.description = `**Description**: ${command.description}\n**Command group**: ${command.group}`

      if (command.guildOnly) {
        obj.description = `${obj.description}\n**Works in DMs**: No`
      } else {
        obj.description = `${obj.description}\n**Works in DMs**: Yes`
      }

      // Add in aliases and permissions in seperate fields

      if (command.aliases.length !== 0) {
        if (!obj.fields)obj.fields = []
        let aliases = ``
        command.aliases.forEach(element => aliases = `${aliases} \`${element}\`,`)
        obj.fields.push({name: 'Aliases', value: aliases, inline: true})
      }
      if (command.permissions.length !== 0) {
        if (!obj.fields)obj.fields = []
        let perms = ``
        command.permissions.forEach(element => perms = `${perms} \`${element}\`,`)
        obj.fields.push({name: 'Required permissions', value: perms, inline: true})
      }

      obj.title = `${this.capitalizeFirstLetter(command.name)} help`

      DMChannel.sendInfo(msg.author, obj)
      return
    }

    if (!this._assembled) this.assemble()
    await DMChannel.sendInfo(msg.author, this._assembled)
  }

  assemble () {
    var organised = {}
    var commands = Object.values(this.client.commands)
    commands.forEach(function (command) {
      if (!command.client) return // This means that it is the "aliases" object and not a command.
      if (command.hidden) return // this means that it is a HIDDEN COMMAND
      if (organised[command.group]) {
        organised[command.group].push(command)
      } else {
        organised[command.group] = [command]
      }
    })
    // Turn that into an embed.
    var embed = {
      title: 'Help menu',
      description: "Listed below is all of Polaris' commands. Need more help? Join our [Discord](https://discord.gg/eVyVK5J). do `.settings` to set up.",
      fields: []
    }

    let groups = Object.values(organised)
    groups.forEach(function (group) {
      let groupContent = ``
      group.forEach(command => groupContent = `${groupContent}**${command.name}** - ${command.description}\n`)
      embed.fields.push({name: group[0].group, value: groupContent})
    })
    embed.footer = {text: 'Polaris bot', icon_url: this.client.user.avatarURL}
    this._assembled = embed

    return embed
  }
  capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}
module.exports = helpCommand
