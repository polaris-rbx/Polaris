const request = require('request-promise')
class Roblox {
  constructor () {
    this._userCache = new Map()
    this._groupCache = new Map()

    // this._group = require('./baseClasses/group.js')
    this._user = require('./baseClasses/user.js')
  }
  async createUser (id) {
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
      return this.createUser(id)
    } else {
      return this._userCache.get(id)
    }
  }
}

module.exports = Roblox
async function wrap () {
  const robloxClass = new Roblox()
  const user = await robloxClass.getUser('665924123931') // 66592931
  if (user.error) {
    console.log(user.error.message)
    return
  }
  // user.updateUsername()
  user.getPlayerInfo().then(res => {
    console.log(res)
  })
}
wrap()

// validateUser()
// getUserInfo?
