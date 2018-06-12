'use strict'
let Polaris = require('../../util/client.js')
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
      const res = await this.verifiedRoles(false, msg.member)
      if (res.error) {
        return msg.channel.sendError(msg.author, {title: 'No permissions', description: res.error})
      }
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
      if (reply.error) return msg.channel.sendError(msg.author, reply.error)
      msg.channel.sendSuccess(msg.author, reply)
    } else {
      msg.channel.sendError(msg.author, 'I could not find any roles to give or remove from you.\nRank data is cached for up to 15 minutes. If you were ranked recently, retry later.')
    }
  }
  // Return true for success, false for otherwise.
  async giveRoles (settings, member, robloxId) {
    const res = await this.verifiedRoles(true, member)
    if (res.error) return {title: 'No permissions', description: res.error}
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
        var group = await this.client.roblox.getGroup(current.group)
        if (group.error) {
          return {error: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + group.error.message + '`'}}
        }

        let rank = await group.getRank(robloxId)

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
    if (settings.mainGroup.ranksToRoles && settings.mainGroup.id) {
      var mainGroup = await this.client.roblox.getGroup(settings.mainGroup.id)
      if (mainGroup.error) {
        this.client.logError(group.error)
        return {error: {title: 'HTTP Error', description: 'A HTTP Error has occured. Is ROBLOX Down?\n`' + mainGroup.error.message + '`'}}
      }
      const groupRanks = mainGroup.Roles
      const userRank = await mainGroup.getRole(robloxId)

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
    }

    // ROLE GIVER
    for (let roleId of Object.keys(this.rolesToGive)) {
      if (this.rolesToRemove[roleId]) {
        delete this.rolesToRemove[roleId]
      }

      if (!checkForPresence(member.roles, roleId)) {
        const role = this.member.guild.roles.get(roleId)
        try {
          if (role) {
            await member.guild.addMemberRole(member.id, roleId)
            addedMsg = `${addedMsg}${role.name}\n`
          }
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
            if (role) {
              await member.guild.removeMemberRole(member.id, roleId)
              removedMsg = `${removedMsg}\n${role.name}`
            }
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
    var nickChanged = false
    var newNick = await member.guild.updateNickname(settings, member, robloxId)
    if (newNick) {
      if (newNick.error) {
        newNick = newNick.error.message
        throw new Error(newNick.error)
      }
      nickChanged = true
    }

    if (embed.fields.length === 0) {
      // Return false. No roles added.
      if (nickChanged) {
        return {
          title: 'Changed your nickname',
          description: 'Changed nickname to:\n`' + newNick + '`'
        }
      } else return false
    } else {
      if (nickChanged) embed.description = `${embed.description}\nChanged nickname to \`${newNick}\``
      return embed
    }
  }
  async verifiedRoles (isVerified, member) {
    const verifiedName = 'Verified'
    const unverifiedName = 'Unverified'

    var verifiedRole = member.guild.roles.find((role) => role.name === verifiedName)
    var unverifiedRole = member.guild.roles.find((role) => role.name === unverifiedName)
    // Check for roles existing. If they do not exist, create them.
    if (!verifiedRole) {
      // Create verified role
      try {
        verifiedRole = await member.guild.createRole({name: verifiedName})
      } catch (error) {
        return {error: 'I do not have permission to create roles. Please ask a server admin to grant me this permission.'}
      }
    }
    if (!unverifiedRole) {
      // Create unverified role
      try {
        unverifiedRole = await member.guild.createRole({name: unverifiedName})
      } catch (error) {
        return {error: 'I do not have permission to create roles. Please ask a server admin to grant me this permission.'}
      }
    }
    // If user verified
    if (isVerified) {
      // Check for verified role. Add if don't have.
      if (!checkForPresence(member.roles, verifiedRole.id)) {
        // Add role
        try {
          member.guild.addMemberRole(member.id, verifiedRole.id, 'User is verified')
        } catch (error) {
          return {error: 'I do not have permission to add roles. Please ask a server admin to grant me this permission, or move my role.'}
        }
      }
      // Check for unverified role. Remove if have.
      if (checkForPresence(member.roles, unverifiedRole.id)) {
        // Add role
        try {
          member.guild.removeMemberRole(member.id, unverifiedRole.id, 'User is not verified')
        } catch (error) {
          return {error: 'I do not have permission to remove roles. Please ask a server admin to grant me this permission, or move my role.'}
        }
      }
    } else {
      // If user NOT verified
      // Check for verified role. Remove if have.
      if (checkForPresence(member.roles, verifiedRole.id)) {
        // Add role
        try {
          member.guild.removeMemberRole(member.id, verifiedRole.id, 'User is verified')
        } catch (error) {
          return {error: 'I do not have permission to add roles. Please ask a server admin to grant me this permission, or move my role.'}
        }
      }
      // Check for unverified role. add if don't have.
      if (!checkForPresence(member.roles, unverifiedRole.id)) {
        // Add role
        try {
          member.guild.addMemberRole(member.id, unverifiedRole.id, 'User is not verified')
        } catch (error) {
          return {error: 'I do not have permission to remove roles. Please ask a server admin to grant me this permission, or move my role.'}
        }
      }
    }
    return true
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
