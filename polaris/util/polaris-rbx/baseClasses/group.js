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

  async updateInfo () {
    try {
      const res = request(`https://groups.roblox.com/v1/groups/${this.id}`);
      const emblemPromise = request(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${this.id}&size=150x150&format=Png`);
      const rolesPromise = request(`https://groups.roblox.com/v1/groups/${this.id}/roles`);

      const [groupRes, emblemRes, rolesRes] = await Promise.all([res, emblemPromise, rolesPromise]);
      const [groupInfo, emblem, roles] = await Promise.all([groupRes.json(), emblemRes.json(), rolesRes.json()]);

      const newGroup = this;
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

    try {
      let res = await request(`https://groups.roblox.com/v1/groups/${this.id}`);
      res = await res.json();
      this.name = res.Name;
      this.roles = res.Roles;
      this.description = res.Description;
      this.owner = res.Owner;
      this.emblemUrl = res.EmblemUrl;
    } catch (error) {
      if (error.status === 404) {
        return {
          error: {
            status: 404,
            message: "Group not found"
          }
        };
      }
      if (error.status === 503 || error.status === 500) {
        return {
          error: {
            status: 503,
            message: "Group info not available"
          }
        };
      }
      // Not 404
      if (error.text) {
        throw new Error(await error.text());
      } else {
        throw new Error(error);
      }
    }
  }

  async getRoles () {
    if (this.roles) return this.roles;

    const res = await this.updateInfo();
    if (res.error) return res;
    return this.Roles;
  }
}

module.exports = Group;
