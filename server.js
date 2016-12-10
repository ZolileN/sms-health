require('dotenv').config({ silent: true });

// Requirement statements
const apiMedicModel = require('./models/api-medic-model');
const conversationController = require('./controllers/conversation-controller');
const cache = require('./models/cache-model');
const log = require('./helpers/logging-helper');
const express = require('express');
const bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.json());

app.post('/v1', (req, res) => {
  conversationController.handleConversation(req, res)
  .then(() => {
    res.status(200).send();
  })
  .catch((err) => {
    res.status(500).send();
    log.error(err);
  });
});

app.listen(3000, () => {
  log.info('server started');
});

// apiMedicModel.getDiagnosis([12, 13], 'male', 1993)
// .then((body) => {
//   console.log(body);
// })
// .catch((err) => {
//   console.log(err);
// });
