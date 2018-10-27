class Group {
    constructor(id, main, binds, ranks_to_roles) {
        this.id = id;
        this.main = main;
        this.binds = binds;
        this.ranks_to_roles = ranks_to_roles;
    }
}

module.exports = { Group };
