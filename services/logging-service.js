require('dotenv').config({ silent: true });

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  info(message, userId) {
    console.log(message);
    pg('event_log').insert({
      event_type: 'info',
      usr_id: userId,
      message,
      ts: new Date(),
    }).catch(err => console.log(err));
  },
  error(message, eventType, userId) {
    console.error(message);
    pg('event_log').insert({
      event_type: 'error',
      usr_id: userId,
      message,
      ts: new Date(),
    }).catch(err => console.log(err));
  },
};
