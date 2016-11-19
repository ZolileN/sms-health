require('dotenv').config({ silent: true });

const gcloud = require('google-cloud');

const translate = gcloud.translate({
  key: process.env.GOOGLE_API_KEY,
});

function detectLanguage(text) {
  return new Promise((resolve, reject) => {
    translate.detect(text, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

function translateToEnglish(text, fromLanguage) {
  const translateOptions = {
    from: fromLanguage,
    to: 'en',
    format: 'text',
  };
  return new Promise((resolve, reject) => {
    translate.translate(text, translateOptions, (err, translation) => {
      if (err) {
        reject(err);
      } else {
        resolve(translation);
      }
    });
  });
}

function translateToLanguage(text, toLanguage) {
  const translateOptions = {
    from: 'en',
    to: toLanguage,
    format: 'text',
  };
  return new Promise((resolve, reject) => {
    translate.translate(text, translateOptions, (err, translation) => {
      if (err) {
        reject(err);
      } else {
        resolve(translation);
      }
    });
  });
}


module.exports = {
  detectLanguage,
  translateToEnglish,
  translateToLanguage,
};
