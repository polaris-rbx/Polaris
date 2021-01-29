const groupClass = require("./baseClasses/group.js");
const userClass = require("./baseClasses/user.js");
const request = require("./request");

const THUMBNAILS_API_URL = "https://thumbnails.roblox.com";

class Roblox {
  constructor (client) {
    this.client = client;
    this._userCache = new Map();
    this._groupCache = new Map();

    // base classes:
    this._user = userClass;
    this._group = groupClass;

    // Cache clear timers
    const Roblox = this;

    // Clear group cache (Group info & ranks - everything.)
    setInterval(() => { Roblox._groupCache.clear(); }, 3600000);
    setInterval(() => { Roblox._userCache.clear(); }, 7200000);
    // Clear group RANK cache
    setInterval(() => {
      Roblox.clearRanks();
    }, 600000);
    this.clearRanks = () => Roblox._groupCache.forEach(group => group.clearCache());
  }

  async _createUser (id) {
    const roblox = this;
    try {
      let res = await request(`https://users.roblox.com/v1/users/${id}`);
      if (res) {
        const newUser = new roblox._user(this, id);
        res = await res.json();
        newUser.username = res.name;
        newUser.created = new Date(res.created);
        newUser.name = res.name;
        newUser.id = res.id || id;
        newUser.isBanned = res.isBanned;
        newUser.blurb = res.description;

        roblox._userCache.set(id, newUser);
        return newUser;
      } return {
        error: {
          status: 404,
          message: "User does not exist"
        }
      };
    } catch (err) {
      if (err.status === 404) {
        return {
          error: {
            status: 404,
            message: "User does not exist"
          }
        };
      }
      if (err.status === 503) {
        return {
          error: {
            status: 503,
            message: "Service Unavailible - Roblox is down."
          }
        };
      }
      // Not 404, put to sentry in future
      throw Error(err);
    }
  }

  async getUser (id) {
    if (!this._userCache.get(id)) {
      return this._createUser(id);
    }
    return this._userCache.get(id);
  }

  async getUserFromName (name) {
    try {
      let res = await request(`https://users.roblox.com/v1/usernames/users`, {
        method: "POST",
        body: JSON.stringify({ usernames: [name] }),
        headers: { "Content-Type": "application/json" }
      });
      if (res) {
        res = await res.json();
        if (res.data.length === 0) {
          return {
            error: {
              status: 404,
              message: "User not found"
            }
          };
        }
        const { id, name: username } = res.data[0];
        const newUser = new this._user(this, id);

        newUser.username = username;
        this._userCache.set(id, newUser);
        return newUser;
      }
      return false;
    } catch (err) {
      if (err.status === 404) {
        return {
          error: {
            status: 404,
            message: "User does not exist"
          }
        };
      }
      if (err.status === 503) {
        return {
          error: {
            status: 503,
            message: "Service Unavailable - Roblox is down."
          }
        };
      }
      this.client.logError(err);
      return false;
    }
  }

  async getGroup (id) {
    if (!id) {
      return {
        error: {
          status: 400,
          message: "Group id is required"
        }
      };
    }
    if (this._groupCache.get(id)) {
      return this._groupCache.get(id);
    }
    const roblox = this;
    // Group does not already exist!
    try {
      const res = request(`https://groups.roblox.com/v1/groups/${id}`);
      const emblemPromise = request(`${THUMBNAILS_API_URL}/v1/groups/icons?groupIds=${id}&size=150x150&format=Png`);
      const rolesPromise = request(`https://groups.roblox.com/v1/groups/${id}/roles`);

      const [groupRes, emblemRes, rolesRes] = await Promise.all([res, emblemPromise, rolesPromise]);
      const [groupInfo, emblem, roles] = await Promise.all([groupRes.json(), emblemRes.json(), rolesRes.json()]);

      const newGroup = new roblox._group(groupInfo.id);
      newGroup.name = groupInfo.name;
      newGroup.description = groupInfo.description;
      newGroup.owner = groupInfo.owner;
      newGroup.memberCount = groupInfo.memberCount;

      newGroup.emblemUrl = emblem.data ? emblem.data[0].imageUrl : "";
      newGroup.roles = roles.roles;

      if (groupInfo.shout) {
        newGroup.shout = {
          message: groupInfo.shout.body,
          postedBy: groupInfo.shout.poster.username
        };
      }
      roblox._groupCache.set(id, newGroup);
      return newGroup;
    } catch (error) {
      if (error.status === 404 || error.status === 500) {
        return {
          error: {
            status: 404,
            message: "Group not found"
          }
        };
      }
      if (error.status === 503) {
        return {
          error: {
            status: 503,
            message: "Group info not available"
          }
        };
      }
      // Not 404
      this.client.logError(error);
      return error;
    }
  }

  async getGroupByName (name) {
    if (!name) return false;
    name = encodeURIComponent(name);
    try {
      let res = await request(`https://grousp.roblox.com/v1/groups/search?keyword=${name}&prioritizeExactMatch=true&limit=10`);
      res = await res.json();
      return res.data[0];
    } catch (error) {
      if (error.status === 404 || error.status === 400) {
        return {
          error: {
            status: 404,
            message: "User or group not found"
          }
        };
      }
      if (error.status === 503) {
        return {
          error: {
            status: 503,
            message: "Service Unavailable - Roblox is down."
          }
        };
      }
      throw new Error(error);
    }
  }

  // API FUNCTIONS. Return simple things, not classes.
  async getIdFromName (Username) {
    const res = await this.getUserFromName(Username);
    if (res.error) return res.error;
    return res.id;
  }

  async getNameFromId (id) {
    const res = this.getUser(id);
    if (res.error) return res.error;
    return res.id;
  }
}
module.exports = Roblox;
