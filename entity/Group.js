module.exports = {
  name: 'Group',
  columns: {
    id: {
      primary: true,
      type: 'int',
      length: 40
    },
    main: {
      type: 'boolean',
      default: 'true'
    },
    binds: {
      type: 'jsonb',
      array: true
    },
    ranks_to_roles: {
      type: 'boolean',
      default: 'false'
    }
  }
};