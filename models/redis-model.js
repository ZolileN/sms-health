const redis = require('redis');
const bluebird = require('bluebird');
const conversationLog = require('./conversation-logging-model');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const client = redis.createClient({ url: process.env.REDIS_URL });

module.exports = {
  setUserDocument(userId, object) {
    const val = object;
    console.log(val);
    val.timestamp = new Date().toISOString();
    return client.hmsetAsync(`user.${userId}`, val);
  },
  setLastSentMessage(userId, message) {
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const retrievedDoc = doc || {};
      retrievedDoc.lastSentMessage = message;
      return this.setUserDocument(userId, retrievedDoc);
    });
  },
  setDiagnosis(userId, diagnosis) {
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const retrievedDoc = doc || {};
      retrievedDoc.lastSentMessage = 'diagnosisResults';
      retrievedDoc.diagnosis = JSON.stringify(diagnosis);
      return this.setUserDocument(userId, retrievedDoc);
    });
  },
  setProposedSymptoms(userId, symptoms) {
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const retrievedDoc = doc || {};
      retrievedDoc.lastSentMessage = 'proposedSymptoms';
      retrievedDoc.symptoms = JSON.stringify(symptoms);
      return this.setUserDocument(userId, retrievedDoc);
    });
  },
  getUserDocument(userId) {
    return client.hgetallAsync(`user.${userId}`).then((doc) => {
      const parsedDoc = doc;
      if (doc.messages) {
        parsedDoc.messages = JSON.parse(doc.messages);
      }
      if (doc.proposedSymptoms) {
        parsedDoc.proposedSymptoms = JSON.parse(doc.proposedSymptoms);
      }
      if (doc.diagnosis) {
        parsedDoc.diagnosis = JSON.parse(doc.diagnosis);
      }
      return parsedDoc;
    });
  },
  addConversationMessage(userId, message, direction) {
    if (!userId) {
      return new Promise((resolve) => {
        resolve();
      });
    }
    const val = message;
    val.timestamp = new Date().toISOString();
    return new Promise((resolve, reject) => {
      client.hgetallAsync(`user.${userId}`)
      .then((doc) => {
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
        this.setUserDocument(userId, retrievedDoc);
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
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
