require('dotenv').config({ silent: true });

const log = require('../helpers/logging-helper');

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  createUser(phoneNumber, gender, age) {
    return pg('user').insert({
      phone_number: phoneNumber,
      gender,
      age,
      ts: new Date(),
    }).catch((err) => {
      log.error(err);
    });
  },
  getUserById(userId) {
    return pg('user').first({ usr_id: userId })
    .then(user => user)
    .catch((err) => {
      log.error(err, userId);
    });
  },
  getUsersByPhoneNumber(phoneNumber) {
    return pg('user').where({ phone_number: phoneNumber })
    .then(user => user)
    .catch((err) => {
      log.error(err);
    });
  },
};
