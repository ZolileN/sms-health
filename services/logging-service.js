require('dotenv').config({ silent: true });

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  createLog(message, eventType, userId) {
    pg('event_log').insert({
      event_type: eventType,
      usr_id: userId,
      message,
      ts: new Date(),
    }).catch(err => console.log(err));
  },
};
