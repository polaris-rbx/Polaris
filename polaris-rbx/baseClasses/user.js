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
        res = JSON.parse(res)
        user.username = res.Username
      })
      .catch(function (err) {
        if (err.statusCode === 404) {
          // Delete user, isn't real?
        }
        console.log(err)
      })
  }
  // No catch for getRank or getRole as if they error its likely a HTTP thing  that I want to know about.
  async getRankInGroup (groupId) {
    if (groupId) {
      groupId = '' + groupId
      // Cache
      if (this._groupRanks[groupId]) {
        if (this._groupRanks[groupId.rank]) return this._groupRanks[groupId.rank]
      } else this._groupRanks[groupId] = {}

      var rank = await request(`https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=${this.id}&groupId=${groupId}`)

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

      var res = await request(`https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${this.id}&groupId=${groupId}`)

      if (!res) return {error: {status: 404, message: 'User or group not found'}}

      this._groupRanks[groupId].role = res
      return res
    }
  }
  async getPlayerInfo () {
    // Check for player info fetched
    if (this.age) {
      return {
        age: this.age,
        blurb: this.blurb,
        status: this.status,
        username: this.username,
        joinDate: this.joinDate
      }
    } else {
      var roblox = this
      try {
        var res = await request(`https://www.roblox.com/users/${this.id}/profile`)
        let body = Cheerio.load(res)

        roblox.blurb = body('.profile-about-content-text').text()
        roblox.status = body('div[data-statustext]').attr('data-statustext')
        roblox.joinDate = body('.profile-stats-container .text-lead').eq(0).text()

        roblox.joinDate = rbxDate(this.joinDate, 'CT')

        let currentTime = new Date()
        roblox.age = Math.round(Math.abs((roblox.joinDate.getTime() - currentTime.getTime()) / (24 * 60 * 60 * 1000)))
        const obj = {
          username: roblox.username,
          status: roblox.status,
          blurb: roblox.blurb,
          joinDate: roblox.joinDate,
          age: roblox.age
        }
        return obj
      } catch (error) {
        if (error.statusCode === 400) {
          return {error: {message: 'User not found', status: 400}}
        }
        throw new Error(error)
      }
    }
  }
}

module.exports = User

// Froast's (sentanos') time function. I don't want to re-make something similar. Repo: https://github.com/sentanos/roblox-js/
function isDST (time) {
  var today = new Date(time)
  var month = today.getMonth()
  var dow = today.getDay()
  var day = today.getDate()
  var hours = today.getHours()
  if (month < 2 || month > 10) {
    return false
  }
  if (month > 2 && month < 10) {
    return true
  }
  if (dow === 0) {
    if (month === 2) {
      if (day >= 8 && day <= 14) {
        return hours >= 2
      }
    } else if (month === 10) {
      if (day >= 1 && day <= 7) {
        return hours < 2
      }
    }
  }
  var previousSunday = day - dow
  if (month === 2) {
    return previousSunday >= 8
  }
  return previousSunday <= 0
}

function rbxDate (time, timezone) {
  return new Date(time + ' ' + timezone.substring(0, 1) + (isDST(time) ? 'D' : 'S') + timezone.substring(1))
}
