require('dotenv').config({ silent: true });

const twilio = require('twilio');

const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function sendSMSMessage(phoneNumber, messageBody) {
  return new Promise((resolve, reject) => {
    client.sms.messages.create({
      to: phoneNumber,
      from: process.env.TWILIO_NUMBER,
      body: messageBody,
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { sendSMSMessage };
