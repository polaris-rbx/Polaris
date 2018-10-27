class Blacklist {
    constructor(id, set_at, reason, set_by) {
        this.id = id;
        this.set_at = set_at;
        this.reason = reason;
        this.set_by = set_by;
    }
}

module.exports = { Blacklist };
