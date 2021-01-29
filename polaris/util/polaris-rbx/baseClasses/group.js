const request = require("../request");

class Group {
  constructor (groupId) {
    this.id = groupId;
    this.users = new Map();
  }

  clearCache () {
    // Clear rank cache
    this.users.clear();
  }

  async _getRankObject (id) {
    let res = await request(`https://groups.roblox.com/v2/users/${id}/groups/roles`);
    res = await res.json();
    return res.data.filter(i => this.id === i.group.id).role || {};
  }

  async getRank (userIdOrUserClass) {
    if (!userIdOrUserClass) return 0;
    const id = typeof userIdOrUserClass === "number" || typeof userIdOrUserClass === "string" ? userIdOrUserClass : userIdOrUserClass.id;
    if (this.users.get(id)) {
      // Possible cache hit
      if (this.users.get(id).rank !== undefined) return this.users.get(id).rank;
    }
    try {
      const roleObject = await this._getRankObject(id);
      const rank = roleObject.rank || 0;

      if (this.users.get(id)) {
        const cache = this.users.get(id);
        cache.rank = rank;
        this.users.set(id, cache);
      } else {
        this.users.set(id, { rank });
      }
      return rank;
    } catch (error) {
      if (error.status === 404 || error.status === 400) {
        return {
          error: {
            status: 404,
            message: "User or group not found"
          }
        };
      }
      if (error.status === 503 || error.status === 500) {
        return {
          error: {
            status: 503,
            message: "Service Unavailable - Roblox is down."
          }
        };
      }
      if (error.text) {
        throw new Error(await error.text());
      } else {
        throw new Error(error);
      }
    }
  }

  async getRole (userIdOrUserClass) {
    if (!userIdOrUserClass) throw new Error("Getrole was not passed a user");
    const id = typeof userIdOrUserClass === "number" || typeof userIdOrUserClass === "string" ? userIdOrUserClass : userIdOrUserClass.id;
    const cache = this.users.get(id);
    if (cache && cache.role) {
      // Possible cache hi
      return cache.role;
    }
    try {
      const roleObject = await this._getRankObject(id);
      const role = roleObject.role || "Guest";

      if (this.users.get(id)) {
        this.users.get(id).role = role;
      } else {
        this.users.set(id, { role });
      }
      return role;
    } catch (error) {
      if (error.status === 404 || error.status === 400) {
        return {
          error: {
            status: 404,
            message: "User or group not found"
          }
        };
      }
      if (error.status === 503 || error.status === 500) {
        return {
          error: {
            status: 503,
            message: "Service Unavailable - Roblox is down."
          }
        };
      }
      if (error.text) {
        throw new Error(await error.text());
      } else {
        throw new Error(error);
      }
    }
  }
}

module.exports = Group;
