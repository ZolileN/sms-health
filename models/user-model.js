require('dotenv').config({ silent: true });

const log = require('./../helpers/logging-helper');

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: 'knex,public',
});

module.exports = {
  createUser(phoneNumber, gender, age) {
    pg('user')
    .where({ phone_number: phoneNumber })
    .del()
    .then(() => pg('user').insert({ phone_number: phoneNumber, gender, age, ts: new Date() }))
    .catch((err) => {
      log.error(err);
    });
  },
  updateUsersGender(phoneNumber, gender) {
    return pg('user').update({
      gender,
      ts: new Date(),
    })
    .where({ phone_number: phoneNumber })
    .catch((err) => {
      log.error(err);
    });
  },
  updateUsersAge(phoneNumber, age) {
    return pg('user').update({
      age,
      ts: new Date(),
    })
    .where({ phone_number: phoneNumber })
    .catch((err) => {
      log.error(err);
    });
  },
  getUserByPhoneNumber(phoneNumber) {
    return pg('user')
    .where('phone_number', phoneNumber)
    .first('age', 'gender')
    .then(user => user)
    .catch((err) => {
      log.error(err);
    });
  },
};
