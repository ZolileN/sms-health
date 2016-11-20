const redis = require('redis');
const bluebird = require('bluebird');

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
    return client.hgetallAsync(`user.${userId}`);
  },
  addConversationMessage(conversationId, message) {
    const val = message;
    val.timestamp = new Date().toISOString();
    return client.rpushAsync(`conversation.${conversationId}`, JSON.stringify(val));
  },
  getConversation(conversationId) {
    return client.lrangeAsync(`conversation.${conversationId}`, 0, -1).then((items) => {
      const list = [];
      items.forEach((item) => {
        list.push(JSON.parse(item));
      });
      return list;
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
