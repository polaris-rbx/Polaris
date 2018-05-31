const request = require('request-promise')
const Cheerio = require('cheerio')
class User {
  constructor (Roblox, userId) {
    this.roblox = Roblox
    this.id = userId
    // Keys: groupIds, values: objects with 2 keys. rank: number, role: string
    this._groupRanks = {}
  }
  async getUsername () {
    if (this.username) {
      return this.username
    } else {
      await this.updateUsername()
      return this.username
    }
  }
  // RETURNS: USERNAME OR NULL FOR FAIL.
  async updateUsername () {
    var user = this
    request(`https://api.roblox.com/users/${this.id}`)
      .then(function (res) {
        user.username = res.Username
      })
      .catch(function (err) {
        if (err.statusCode === 404) {
          // Delete user, isn't real?
        }
        console.log(err)
      })
  }

  async getRankInGroup (groupId) {
    if (groupId) {
      groupId = '' + groupId
      // Cache
      if (this._groupRanks[groupId]) {
        if (this._groupRanks[groupId.rank]) return this._groupRanks[groupId.rank]
      } else this._groupRanks[groupId] = {}

      var rank = null
      try {
        rank = await request(`https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=${this.id}&groupId=${groupId}`)
      } catch (error) {
        if (error.statusCode === 404) {
          return handleError(error)
        }
      }

      if (!rank) return {error: {status: 404, message: 'User or group not found'}}

      rank = parseInt(rank.substring(22), 10)
      this._groupRanks[groupId].rank = rank
      return rank
    }
  }

  async getRoleInGroup (groupId) {
    if (groupId) {
      groupId = '' + groupId
      // Cache
      if (this._groupRanks[groupId]) {
        if (this._groupRanks[groupId.role]) return this._groupRanks[groupId.role]
      } else this._groupRanks[groupId] = {}

      var res = null
      try {
        res = await request(`https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${this.id}&groupId=${groupId}`)
      } catch (error) {
        return handleError(error)
      }

      if (!res) return {error: {status: 404, message: 'User or group not found'}}

      this._groupRanks[groupId].role = res
      return res
    }
  }
}

module.exports = User

function handleError (error) {
  return {
    error: {
      message: JSON.parse(error.message),
      status: error.statusCode
    }
  }
}
