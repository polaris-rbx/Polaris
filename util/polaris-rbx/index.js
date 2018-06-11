const request = require('request-promise')
class Roblox {
  constructor (client) {
    this.client = client
    this._userCache = new Map()
    this._groupCache = new Map()
    // base classes:
    this._user = require('./baseClasses/user.js')
    this._group = require('./baseClasses/group.js')
    // Cache clear timers
    const ROBLOX = this
    setInterval(function () { ROBLOX._groupCache = new Map(); console.log('Cleared Group cache') }, 900000)
    setInterval(function () { ROBLOX._userCache = new Map(); console.log('Cleared user cache') }, 7200000)
  }
  async _createUser (id) {
    var roblox = this
    try {
      var res = await request(`https://api.roblox.com/users/${id}`)
      if (res) {
        var newUser = new roblox._user(this, id)
        res = JSON.parse(res)
        newUser.username = res.Username
        roblox._userCache.set(id, newUser)
        return newUser
      } else return {error: {status: 404, message: 'User does not exist'}}
    } catch (err) {
      if (err.statusCode === 404) {
        return {error: {status: 404, message: 'User does not exist'}}
      }
      // Not 404, put to sentry in future
      throw Error(err)
    }
  }
  async getUser (id) {
    if (!this._userCache.get(id)) {
      return this._createUser(id)
    } else {
      return this._userCache.get(id)
    }
  }
  async getUserFromName (name) {
    try {
      var res = await request(`https://api.roblox.com/users/get-by-username?username=${name}`)
      if (res) {
        res = JSON.parse(res)
        if (!res.Id) {
          if (res.errorMessage === 'User not found') return {error: {status: 404, message: res.errorMessage}}
          this.client.logError(res)
          return {error: {status: 0, message: res.errorMessage}}
        }
        var newUser = new this._user(this, res.Id)

        newUser.username = res.Username
        this._userCache.set(res.Id, newUser)
        return newUser
      } else return {error: {status: 404, message: 'User does not exist'}}
    } catch (err) {
      if (err.statusCode === 404) {
        return {error: {status: 404, message: 'User does not exist'}}
      }
      this.client.logError(err)
    }
  }

  async getGroup (id) {
    if (!id) return {error: {status: 400, message: 'Group id is required'}}
    if (this._groupCache.get(id)) {
      return this._groupCache.get(id)
    }
    var roblox = this
    // Group does not already exist!
    try {
      var res = await request(`http://api.roblox.com/groups/${id}`)
      res = JSON.parse(res)
      const newGroup = new roblox._group(res.Id)
      newGroup.Name = res.Name
      newGroup.Roles = res.Roles
      roblox._groupCache.set(id, newGroup)
      return newGroup
    } catch (error) {
      if (error.statusCode === 404 || 500) return {error: {status: 404, message: 'Group not found'}}
      if (error.statusCode === 503) return {error: {status: 503, message: 'Group info not available'}}
      // Not 404
      this.client.logError(error)
    }
  }

  // API FUNCTIONS. Return simple things, not classes.
  async getIdFromName (Username) {
    const res = await this.getUserFromName(Username)
    if (res.error) return res.error
    return res.id
  }
  async getNameFromId (id) {
    const res = this.getUser(id)
    if (res.error) return res.error
    return res.id
  }
}
module.exports = Roblox
