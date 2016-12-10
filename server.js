require('dotenv').config({ silent: true });

// Requirement statements
const conversationController = require('./controllers/conversation-controller');
const log = require('./helpers/logging-helper');
const express = require('express');
const bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.urlencoded());

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

app.listen(process.env.PORT || 3000, () => {
  log.info('server started');
});
