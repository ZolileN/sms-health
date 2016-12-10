require('dotenv').config({ silent: true });

const log = require('./../helpers/logging-helper');

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  log(userId, messageId, message, direction, timestamp) {
    const formattedDirection = direction === 'incoming' ? 'i' : 'o';
    pg('message_log').insert({
      user_id: userId,
      message_id: messageId,
      message_direction: formattedDirection,
      message,
      ts: new Date(timestamp),
    }).catch((err) => {
      log.error(err);
    });
  },
};
