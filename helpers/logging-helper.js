require('dotenv').config({ silent: true });

const moment = require('moment');
const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  info(message) {
    console.log(message);
    pg('event_log').insert({
      event_type: 'info',
      message,
      ts: moment().utc().format(),
    }).catch(err => console.log(err));
  },
  error(message) {
    console.error(message);
    pg('event_log').insert({
      event_type: 'error',
      message,
      ts: moment().utc().format(),
    }).catch(err => console.log(err));
  },
};
