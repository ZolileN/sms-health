require('dotenv').config({ silent: true });

const twilio = require('twilio');
const redis = require('./redis-model');
const log = require('../helpers/logging-helper');

const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sendSMSMessage(phoneNumber, messageBody, userId) {
  return redis.addConversationMessage(userId, messageBody, 'outgoing')
  .then(() => {
    if (!process.env.TWILIO_LOG_OUTPUT) {
      client.sms.messages.create({
        to: phoneNumber,
        from: process.env.TWILIO_NUMBER,
        body: messageBody,
      }, (err) => {
        if (err) {
          log(err);
        }
      });
    } else {
      console.log(`TWILLIO MESSAGE: ${messageBody}`);
    }
  });
}

module.exports = { sendSMSMessage };
