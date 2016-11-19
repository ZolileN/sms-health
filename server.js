require('dotenv').config({ silent: true });

// Requirement statements
const NodeCache = require('node-cache');
const twilioService = require('./twilio-service');
const apiMedicService = require('./api-medic-service');
const languageService = require('./language-service');
const translateService = require('./translate-service');
// const loggingService = require('./logging-service');
const stringComparisonService = require('./string-comparison-service');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');

const cache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 60 * 2 });

const app = express();

app.use(bodyParser.json());

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
  console.log('Example app listening on port 3000!');
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

// console.log(stringComparisonService.compareEntitiesAndDescriptions(
//   [{
//     name: 'cough',
//     type: 'OTHER',
//     salience: 0.62,
//   },
//   {
//     name: 'sore throat',
//     type: 'OTHER',
//     salience: 0.23,
//   },
//   {
//     name: 'stuffy nose',
//     type: 'OTHER',
//     salience: 0.15,
//   }],
//   [{
//   	ID: 10,
//   	Name: 'Abdominal pain'
//   }, {
//   	ID: 238,
//   	Name: 'Anxiety'
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
