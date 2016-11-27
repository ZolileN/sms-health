require('dotenv').config({ silent: true });

const twilio = require('../models/twilio-model');
const apiMedic = require('../models/api-medic-model');
const translate = require('../models/translate-model');
const redis = require('../models/redis-model');
const cache = require('../models/cache-model');
const user = require('../models/user-model');
const stringComparison = require('../helpers/string-comparison-helper');
const log = require('../helpers/logging-helper');
const uuid = require('uuid');

const messages = {
  greeting: 'Hi, Thank you for using the SMSHealth service.',
  demo: 'This is a demo version of this service and should only be used for testing. Consult a doctor for any medical questions.',
  error: 'We\'re sorry, there was an error processing your request. Please try again later.',
  timeoutError: 'Thank you for using the SMSHealth service. This conversation is older than 24 hours, and the information is unretrievable. Please text "HELP" to this number to start the conversation again.',
  storedInformation: 'This phone number has previously reported STORED_GENDER as the gender and STORED_AGE as the age. Would you like to continue using this ("Y" or "N")?',
  storedInformationError: 'We\'re sorry, there was an issue processing your response. Please try again using "Y" or "N".',
  age: 'What is your age? Example: 23.',
  ageError: 'We\'re sorry, there was an issue saving your age. Please try again using numbers between 0 and 115.',
  gender: 'What is your gender (male or female)?',
  genderError: 'We\'re sorry, there was an issue saving your gender. Please try again using "male" or "female".',
  symptoms: 'Can you please describe the symptoms you are experiencing?',
};

function checkIfUserGenderAndAgeInDatabase(phoneNumber) {
  return new Promise((resolve, reject) => {
    user.getUserByPhoneNumber(phoneNumber)
    .then((result) => {
      if (result && result.age && result.gender) {
        resolve({
          age: result.age,
          gender: result.gender,
        });
      }
    })
    .then(user.createUser(phoneNumber))
    .then(() => {
      resolve(false);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

function validateAndFormatAge(age) {
  const formattedAge = Number.parseInt(age, 10);
  if (Number.isInteger(formattedAge) && formattedAge >= 0 && formattedAge <= 115) {
    return formattedAge;
  }
  return null;
}

function validateAndFormatGender(gender) {
  if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female') {
    return gender.toLowerCase() === 'male' ? 'M' : 'F';
  } else if (gender.toLowerCase() === 'm' || gender.toLowerCase() === 'f') {
    return gender.toLowerCase() === 'm' ? 'M' : 'F';
  }
  return null;
}

function handleConversation(req) {
  return new Promise((resolve, reject) => {
    const phoneNumber = req.body.From;
    const userId = cache.get(phoneNumber);
    const messageBody = req.body.Body;
    if (phoneNumber && messageBody === 'HELP') {
      // create user Id
      const newUserId = uuid.v4();
      cache.set(req.body.From, newUserId);
      redis.setUserDocument(newUserId, {})
      .then(() => redis.addConversationMessage(newUserId, 'HELP', 'incoming'))
      .then(() => {
        // send greeting message
        if (process.env.DEMO) {
          twilio.sendSMSMessage(phoneNumber, `${messages.greeting} ${messages.demo}`, newUserId);
        } else {
          twilio.sendSMSMessage(phoneNumber, messages.greeting, newUserId);
        }
      })
      .then(() => checkIfUserGenderAndAgeInDatabase(phoneNumber))
      .then((results) => {
      // check if user's stored information exists in database
        if (results && results.age && results.gender) {
          const formattedGender = results.gender === 'M' ? 'Male' : 'Female';
          twilio.sendSMSMessage(phoneNumber, messages.storedInformation.replace('STORED_GENDER', formattedGender).replace('STORED_AGE', results.age), newUserId)
          .then(() => {
            redis.setUserDocument(newUserId, {
              lastSentMessage: 'storedInformation',
            });
          })
          .then(() => resolve())
          .catch((err) => {
            log.error(err);
            reject();
          });
        } else {
          twilio.sendSMSMessage(phoneNumber, messages.age, newUserId)
          .then(() => {
            redis.setUserDocument(newUserId, {
              lastSentMessage: 'age',
            });
          })
          .then(() => resolve())
          .catch((err) => {
            log.error(err);
            reject();
          });
        }
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, newUserId);
        reject();
      });
    } else if (phoneNumber && userId) {
      let userDoc = {};
      redis.addConversationMessage(userId, messageBody, 'incoming')
      .then(() => redis.getUserDocument(userId))
      .then((userDocument) => {
        userDoc = userDocument;
        switch (userDoc.lastSentMessage) {
          case 'age':
          case 'ageError': {
            const validatedAge = validateAndFormatAge(messageBody);
            if (validatedAge) {
              return user.updateUsersAge(phoneNumber, validatedAge)
              .then(() => twilio.sendSMSMessage(phoneNumber, messages.gender))
              .then(() => {
                redis.setUserDocument(userId, {
                  lastSentMessage: 'gender',
                });
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.ageError)
            .then(() => {
              redis.setUserDocument(userId, {
                lastSentMessage: 'ageError',
              });
            });
          }
          case 'gender':
          case 'genderError': {
            const validatedGender = validateAndFormatGender(messageBody);
            if (validatedGender) {
              return user.updateUsersGender(phoneNumber, validatedGender)
              .then(() => twilio.sendSMSMessage(phoneNumber, messages.symptoms))
              .then(() => {
                redis.setUserDocument(userId, {
                  lastSentMessage: 'symptoms',
                });
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.genderError)
            .then(() => {
              redis.setUserDocument(userId, {
                lastSentMessage: 'genderError',
              });
            });
          }
          case 'storedInformation':
          case 'storedInformationError': {
            if (messageBody.toLowerCase() === 'y' || messageBody.toLowerCase() === 'yes') {
              return twilio.sendSMSMessage(phoneNumber, messages.symptoms);
            } else if (messageBody.toLowerCase() === 'n' || messageBody.toLowerCase() === 'no') {
              return twilio.sendSMSMessage(phoneNumber, messages.age, userId)
              .then(() => {
                redis.setUserDocument(userId, {
                  lastSentMessage: 'age',
                });
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.storedInformationError);
          }
          default:
            return twilio.sendSMSMessage(phoneNumber, messages.error, userId);
        }
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, userId);
        reject();
      });
    } else if (phoneNumber && !userId && messageBody !== 'HELP') {
      twilio.sendSMSMessage(phoneNumber, messages.timeoutError);
      resolve();
    }
  });
}

module.exports = {
  handleConversation,
};
