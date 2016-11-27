const redis = require('redis');
const bluebird = require('bluebird');
const conversationLog = require('./conversation-logging-model');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const client = redis.createClient({ url: process.env.REDIS_URL });

module.exports = {
  setUserDocument(userId, object) {
    const val = object;
    val.timestamp = new Date().toISOString();
    return client.hmsetAsync(`user.${userId}`, val);
  },
  getUserDocument(userId) {
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const parsedDoc = doc;
      if (doc.messages) {
        parsedDoc.messages = JSON.parse(doc.messages);
      }
      return parsedDoc;
    });
  },
  addConversationMessage(userId, message, direction) {
    const val = message;
    val.timestamp = new Date().toISOString();
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const retrievedDoc = doc;
      const timestamp = new Date().toISOString();
      if (!retrievedDoc.messages) {
        retrievedDoc.messages = [];
      } else {
        retrievedDoc.messages = JSON.parse(retrievedDoc.messages);
      }
      retrievedDoc.messages.push({
        message,
        timestamp,
        direction,
      });
      conversationLog.log(userId, retrievedDoc.messages.length, message, direction, timestamp);
      retrievedDoc.messages = JSON.stringify(retrievedDoc.messages);
      return this.setUserDocument(userId, retrievedDoc);
    });
  },
  setLanguageDocument(languageCode, object) {
    const val = object;
    val.timestamp = new Date().toISOString();
    return client.hmsetAsync(`language.${languageCode}`, val);
  },
  getLanguageDocument(languageCode) {
    return client.hgetallAsync(`language.${languageCode}`);
  },
};
