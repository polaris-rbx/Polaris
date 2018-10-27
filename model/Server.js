class Server {
    constructor(id, autoverify, nickname_template, prefix, groups) {
        this.id = id;
        this.autoverify = autoverify;
        this.nickname_template = nickname_template;
        this.prefix = prefix;
        this.groups = groups;
    }
}

module.exports = { Server };
