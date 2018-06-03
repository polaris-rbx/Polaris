const request = require('request-promise')
class Group {
  constructor (groupId) {
    this.id = groupId
    this.users = new Map()
  }
  clearCache () {
    this.users = new Map()
  }
  async getRank (userIdOrUserClass) {
    if (!userIdOrUserClass) return
    var id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id
    if (this.users.get(id)) {
      // Possible cache hit
      if (this.users.get(id).rank) return this.users.get(id).rank
    }
    var options = {
      method: 'GET',
      uri: `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=${id}&groupId=${this.id}`,
      resolveWithFullResponse: true
    }
    try {
      var res = await request(options)
      res = parseInt(res.body.substring(22), 10)
      if (this.users.get(id)) {
        this.users.get(id).rank = res
      } else {
        this.users.set(id, {rank: res})
      }
      return res
    } catch (error) {
      if (error.statusCode === 404 || 400) return {error: {status: 404, message: 'User or group not found'}}
      throw new Error(error)
    }
  }
  async getRole (userIdOrUserClass) {
    if (!userIdOrUserClass) return
    var id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id
    if (this.users.get(id)) {
      // Possible cache hit
      if (this.users.get(id).role) return this.users.get(id).role
    }
    var options = {
      method: 'GET',
      uri: `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${id}&groupId=${this.id}`,
      resolveWithFullResponse: true
    }
    try {
      var res = await request(options)
      res = res.body
      if (this.users.get(id)) {
        this.users.get(id).role = res
      } else {
        this.users.set(id, {role: res})
      }
      return res
    } catch (error) {
      if (error.statusCode === 404 || 400) return {error: {status: 404, message: 'User or group not found'}}
      throw new Error(error)
    }
  }
  async updateInfo () {
    try {
      var res = await request(`https://api.roblox.com/groups/${this.id}`)
      res = JSON.parse(res)
      this.name = res.name
      this.roles = res.roles
    } catch (error) {
      if (error.statusCode === 404) return {error: {status: 404, message: 'Group not found'}}
      if (error.statusCode === 503) return {error: {status: 503, message: 'Group info not available'}}
      // Not 404
      throw new Error(error)
    }
  }
  async getRoles () {
    if (this.roles) return this.roles
    var res = await this.updateInfo
    if (res.error) return res
    return this.Roles
  }
}

module.exports = Group
