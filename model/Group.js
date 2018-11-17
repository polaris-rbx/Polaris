class Group {
    constructor(id, main, binds, ranks_to_roles, server) {
        this.id = id;
        this.main = main;
        this.binds = binds;
        this.ranks_to_roles = ranks_to_roles;
        this.server = server;
    }
}

module.exports = { Group };
