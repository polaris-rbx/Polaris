const request = require('request-promise')
class Roblox {
  constructor () {
    this._userCache = new Map()
    this._groupCache = new Map()

    this._group = require('./baseClasses/group.js')
    this._user = require('./baseClasses/user.js')
  }
  async createUser (id) {
    var roblox = this
    try {
      var res = await request(`https://api.roblox.com/users/${id}`)
      if (res) {
        var newUser = new roblox._user(this, id)
        newUser.username = res
        roblox._userCache.set(id, newUser)
        return newUser
      }
    } catch (err) {
      if (err.statusCode === 404) {
        return {error: {status: 404, message: 'User does not exist'}}
      }
      // Not 404, put to sentry in future
      console.log(err)
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
  const user = await robloxClass.getUser('66592931') // 66592931
  // user.updateUsername()
  user.getRoleInGroup('3812352').then(res => {
    console.log(res)
  })
}
wrap()

// validateUser()
// getUserInfo?
