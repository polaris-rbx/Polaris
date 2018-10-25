module.exports = {
  name: 'Server',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 50
    },
    autoverify: {
      type: 'boolean',
      default: 'false'
    },
    nickname_template: {
      type: 'varchar',
      length: 50,
      nullable: true
    },
    prefix: {
      type: 'varchar',
      length: 2,
      default: '.'
    }
  }
};
