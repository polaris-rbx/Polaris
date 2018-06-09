const request = require('request-promise')
const Cheerio = require('cheerio')
/* INFO WITH USER CLASS:
  * User.id: User ID. Always set
  * User.username: ROBLOX Name. Always set.
  * User.age, User.blurb, User.status, User.joinDate: ROBLOX Profile info. *Not* always set.
 */
class User {
  constructor (Roblox, userId) {
    this.roblox = Roblox
    this.id = userId
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
        throw new Error(err)
      })
  }

  async getInfo () {
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
      return this.updateInfo()
    }
  }

  async updateInfo () {
    if (!this.id) {
      return {error: {message: 'Id is not defined. Please try again - We\'re onto it.', status: 400}}
    }
    var roblox = this
    try {
      var res = await request(`https://www.roblox.com/users/${roblox.id}/profile`)
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
        return {error: {message: 'User not found', status: 400, robloxId: roblox.id, robloxName: roblox.username}}
      }
      throw new Error(error)
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
