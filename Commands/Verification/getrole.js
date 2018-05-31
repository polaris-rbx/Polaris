'use strict'
let Polaris = require('../../util/client.js')
const rbx = require('roblox-js')
class getRoleCommand extends Polaris.command {
  constructor (client) {
    super(client)
    this.description = "Uses a previously linked account and a server's settings to give you roles according to your group rank(s)."
    this.aliases = ['getroles']
    this.group = 'Roblox account verification'
  }
  async execute (msg) {
    // Check for link
    var rbxId = await this.client.db.getLink(msg.author.id)
    if (!rbxId) {
      msg.channel.sendError(msg.author, {title: 'Please link your account', description: 'You need to link your account to get your roles.\nGet started with `.linkaccount`.'})
      return
    }

    // Check for settings

    var settings = await this.client.db.getSettings(msg.member.guild.id)
    if (!settings || (settings.binds.length === 0 && !settings.mainGroup.ranksToRoles)) {
      msg.channel.sendError(msg.author, {title: 'No settings', description: "This server isn't set up yet. Please ask an admin to set up Polaris."})
      return
    }
    const reply = await this.giveRoles(settings, msg.member, rbxId)
    if (reply) {
      msg.channel.sendSuccess(msg.author, reply)
    } else {
      msg.channel.sendError(msg.author, 'I could not find any roles to give or remove from you.')
    }
  }
  // Return true for success, false for otherwise.
  async giveRoles (settings, member, robloxId) {
    this.rolesToGive = {}
    this.rolesToRemove = {}

    var addedMsg = ''
    var removedMsg = ''
    var failedMsg = ''

    this.member = member
    // Var to store pos of binds that relate to deleted roles. It'll only delete one broken bind per run, but that's better than none.
    var bindToDelete
    // binds
    for (let current of settings.binds) {
      if (member.guild.roles.get(current.role)) {
        let rank = await rbx.getRankInGroup(current.group, robloxId)

        if (current.exclusive) {
          if (rank === current.rank) {
            this.rolesToGive[current.role] = current.role
          } else {
            this.rolesToRemove[current.role] = current.role
          }
        } else {
          if (rank >= parseInt(current.rank)) {
            this.rolesToGive[current.role] = current.role
          } else {
            this.rolesToRemove[current.role] = current.role
          }
        }
      } else {
        bindToDelete = current
      }
    }

    if (bindToDelete) {
      settings.binds.splice(bindToDelete, 1)
      this.client.db.updateSetting(member.guild.id, {binds: settings.binds})
    }

    // ranks to roles
    var [groupRanks, userRank] = await Promise.all([rbx.getRoles(settings.mainGroup.id), rbx.getRankNameInGroup(settings.mainGroup.id, robloxId)])
    const role = member.guild.roles.find(current => current.name.toLowerCase() === userRank.toLowerCase())

    if (role) {
      this.rolesToGive[role.id] = role.id
      // Take out of remove list if there.
      if (this.rolesToRemove[role.id]) {
        delete this.rolesToRemove[role.id]
      }
    }

    for (let thisOne of groupRanks) {
      const check = member.guild.roles.find(current => current.name.toLowerCase() === thisOne.Name.toLowerCase())
      if (check) {
        if (!this.rolesToGive[check.id]) {
          this.rolesToRemove[check.id] = check.id
        }
      }
    }

    // ROLE GIVER
    for (let roleId of Object.keys(this.rolesToGive)) {
      if (this.rolesToRemove[roleId]) {
        delete this.rolesToRemove[roleId]
      }

      if (!checkForPresence(member.roles, roleId)) {
        const role = this.member.guild.roles.get(roleId)
        try {
          await member.guild.addMemberRole(member.id, roleId)
          addedMsg = `${addedMsg}${role.name}\n`
        } catch (err) {
          let roleName = role.name
          if (roleName) {
            failedMsg = `${failedMsg}\n${roleName}`
          }
        }
      }
    }

    // ROLE Remover
    for (let roleId of Object.keys(this.rolesToRemove)) {
      if (!this.rolesToGive[roleId]) {
        if (checkForPresence(member.roles, roleId)) {
          const role = this.member.guild.roles.get(roleId)
          try {
            await member.guild.removeMemberRole(member.id, roleId)
            removedMsg = `${removedMsg}\n${role.name}`
          } catch (err) {
            let roleName = role.name
            if (roleName) {
              failedMsg = `${failedMsg}\n${roleName}`
            }
          }
        }
      }
    }
    var embed = {
      title: 'Successfully changed your roles:',
      fields: [],
      description: 'If a role was added, removed or failed to add it will be listed below.'
    }

    if (addedMsg !== '') {
      embed.fields.push({
        name: 'Added the following roles',
        value: addedMsg,
        inline: true
      })
    }
    if (removedMsg !== '') {
      embed.fields.push({
        name: 'Removed the following roles',
        value: removedMsg,
        inline: true
      })
    }
    if (failedMsg !== '') {
      embed.fields.push({
        name: "I couldn't add the following roles",
        value: failedMsg,
        inline: true
      })
    }
    if (embed.fields.length === 0) {
      // Return false. No roles added.
      return false
    } else {
      return embed
    }
  }
}
module.exports = getRoleCommand

function checkForPresence (array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return true
    }
  }
  return false
}
