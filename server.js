require('dotenv').config({ silent: true });

// Requirement statements
const twilioService = require('./services/twilio-service');
const apiMedicService = require('./services/api-medic-service');
const languageService = require('./services/language-service');
const translateService = require('./services/translate-service');
const redisService = require('./services/redis-service');
const log = require('./services/logging-service');
const userService = require('./services/user-service');
const stringComparisonService = require('./services/string-comparison-service');
const NodeCache = require('node-cache');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 * 2 });

const app = express();

app.use(bodyParser.json());


// userService.createUser('+19529562602', 'M', 23).then(() => {
//   return userService.getUsersByPhoneNumber('+19529562602');
// }).then((result) => {
//   console.log(result);
// });

// respond with "hello world" when a GET request is made to the homepage
app.post('/v1', (req, res) => {
  let message = '';
  if (req.body && req.body.From && cache.get(req.body.From) === null) {
    cache.put(req.body.From, uuid.v4());
  }
  if (req.body && req.body.Body) {
    message = req.body.Body;
  }
  translateService.translateToLanguage('It looks like you are having a heart attack', 'ar')
  .then((translation) => {
    twilioService.sendSMSMessage('+19529562602', translation);
  })
  .then(() => {
    res.status(200).send();
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ err }).send();
  });
});

app.listen(3000, () => {
  log.info('server started');
});

apiMedicService.getDiagnosis([12, 13], 'male', 1993)
.then((body) => {
  console.log(body);
})
.catch((err) => {
  console.log(err);
});

// languageService.detectEntities('I have a headache and a sore throat', (err, entities, apiResponse) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(entities);
//     console.log(apiResponse);
//   }
// });

// console.log(stringComparisonService.compareMessageAndDescriptions(
//   'Pain in my eye',
//   [{
//   	ID: 10,
//   	Name: 'Abdominal pain'
//   }, {
//   	ID: 238,
//   	Name: 'Heart Attack'
//   }, {
//   	ID: 104,
//   	Name: 'Back pain'
//   }, {
//   	ID: 75,
//   	Name: 'Burning eyes'
//   }, {
//   	ID: 46,
//   	Name: 'Burning in the throat'
//   }, {
//   	ID: 170,
//   	Name: 'Cheek swelling'
//   }, {
//   	ID: 17,
//   	Name: 'Chest pain'
//   }, {
//   	ID: 31,
//   	Name: 'Chest tightness'
//   }, {
//   	ID: 175,
//   	Name: 'Chills'
//   }, {
//   	ID: 139,
//   	Name: 'Cold sweats'
//   }, {
//   	ID: 15,
//   	Name: 'Cough'
//   }, {
//   	ID: 207,
//   	Name: 'Dizziness'
//   }, {
//   	ID: 244,
//   	Name: 'Drooping eyelid'
//   }, {
//   	ID: 273,
//   	Name: 'Dry eyes'
//   }, {
//   	ID: 87,
//   	Name: 'Earache'
//   }, {
//   	ID: 92,
//   	Name: 'Early satiety'
//   }, {
//   	ID: 287,
//   	Name: 'Eye pain'
//   }, {
//   	ID: 33,
//   	Name: 'Eye redness'
//   }, {
//   	ID: 153,
//   	Name: 'Fast, deepened breathing'
//   }, {
//   	ID: 76,
//   	Name: 'Feeling of foreign body in the eye'
//   }, {
//   	ID: 11,
//   	Name: 'Fever'
//   }, {
//   	ID: 57,
//   	Name: 'Going black before the eyes'
//   }, {
//   	ID: 9,
//   	Name: 'Headache'
//   }, {
//   	ID: 45,
//   	Name: 'Heartburn'
//   }, {
//   	ID: 122,
//   	Name: 'Hiccups'
//   }, {
//   	ID: 149,
//   	Name: 'Hot flushes'
//   }, {
//   	ID: 40,
//   	Name: 'Increased thirst'
//   }, {
//   	ID: 73,
//   	Name: 'Itching eyes'
//   }, {
//   	ID: 96,
//   	Name: 'Itching in the nose'
//   }, {
//   	ID: 35,
//   	Name: 'Lip swelling'
//   }, {
//   	ID: 235,
//   	Name: 'Memory gap'
//   }, {
//   	ID: 112,
//   	Name: 'Menstruation disorder'
//   }, {
//   	ID: 123,
//   	Name: 'Missed period'
//   }, {
//   	ID: 44,
//   	Name: 'Nausea'
//   }, {
//   	ID: 136,
//   	Name: 'Neck pain'
//   }, {
//   	ID: 114,
//   	Name: 'Nervousness'
//   }, {
//   	ID: 133,
//   	Name: 'Night cough'
//   }, {
//   	ID: 12,
//   	Name: 'Pain in the limbs'
//   }, {
//   	ID: 203,
//   	Name: 'Pain on swallowing'
//   }, {
//   	ID: 37,
//   	Name: 'Palpitations'
//   }, {
//   	ID: 140,
//   	Name: 'Paralysis'
//   }, {
//   	ID: 54,
//   	Name: 'Reduced appetite'
//   }, {
//   	ID: 14,
//   	Name: 'Runny nose'
//   }, {
//   	ID: 29,
//   	Name: 'Shortness of breath'
//   }, {
//   	ID: 124,
//   	Name: 'Skin rash'
//   }, {
//   	ID: 52,
//   	Name: 'Sleeplessness'
//   }, {
//   	ID: 95,
//   	Name: 'Sneezing'
//   }, {
//   	ID: 13,
//   	Name: 'Sore throat'
//   }, {
//   	ID: 64,
//   	Name: 'Sputum'
//   }, {
//   	ID: 179,
//   	Name: 'Stomach burning'
//   }, {
//   	ID: 28,
//   	Name: 'Stuffy nose'
//   }, {
//   	ID: 138,
//   	Name: 'Sweating'
//   }, {
//   	ID: 248,
//   	Name: 'Swollen glands in the armpits'
//   }, {
//   	ID: 169,
//   	Name: 'Swollen glands on the neck'
//   }, {
//   	ID: 211,
//   	Name: 'Tears'
//   }, {
//   	ID: 16,
//   	Name: 'Tiredness'
//   }, {
//   	ID: 115,
//   	Name: 'Tremor at rest'
//   }, {
//   	ID: 144,
//   	Name: 'Unconsciousness, short'
//   }, {
//   	ID: 101,
//   	Name: 'Vomiting'
//   }, {
//   	ID: 181,
//   	Name: 'Vomiting blood'
//   }, {
//   	ID: 56,
//   	Name: 'weakness'
//   }, {
//   	ID: 23,
//   	Name: 'Weight gain'
//   }, {
//   	ID: 30,
//   	Name: 'Wheezing'
//   }]
// ));
