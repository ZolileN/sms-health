require('dotenv').config({ silent: true });

const log = require('../helpers/logging-helper');

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  outgoing(conversationId, messageId, message) {
    pg('message_log').insert({
      conversation_id: conversationId,
      message_id: messageId,
      message_direction: 'o',
      message,
      ts: new Date(),
    }).catch((err) => {
      log.error(err);
    });
  },
  incoming(conversationId, messageId, message) {
    pg('message_log').insert({
      conversation_id: conversationId,
      message_id: messageId,
      message_direction: 'i',
      message,
      ts: new Date(),
    }).catch((err) => {
      log.error(err);
    });
  },
};
