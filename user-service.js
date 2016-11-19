require('dotenv').config({ silent: true });

const loggingService = require('./logging-service');

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
      loggingService.createLog(err, 'error');
      console.log(err);
    });
  },
  getUserById(userId) {
    return pg('user').first({ usr_id: userId })
    .then(user => user)
    .catch((err) => {
      loggingService.createLog(err, 'error', userId);
      console.log(err);
    });
  },
  getUsersByPhoneNumber(phoneNumber) {
    return pg('user').where({ phone_number: phoneNumber })
    .then(user => user)
    .catch((err) => {
      loggingService.createLog(err, 'error');
      console.log(err);
    });
  },
};
