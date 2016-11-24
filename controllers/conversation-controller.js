require('dotenv').config({ silent: true });

const twilioModel = require('../models/twilio-model');
const apiMedicModel = require('../models/api-medic-model');
const translateModel = require('../models/translate-model');
const redisModel = require('../models/redis-model');
const cache = require('../models/cache-model');
const log = require('../helpers/logging-helper');
const userModel = require('../models/user-model');
const cacheModel = require('../models/cache-model');
const stringComparisonHelper = require('../helpers/string-comparison-helper');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');


function handleInitialConversation() {

}

function handleRemovedConversation() {

}

function handleGettingSymptoms() {

}

function handleGettingDiagnosis() {

}

function handleMoreInformationRequest() {

}

function handleStopRequest() {

}

function handleConversation(req) {
  return new Promise((resolve, reject) => {
    if (req.body && req.body.From) {
      cacheModel.get(req.body.From)
    }
  });
}

module.exports = {
  handleConversation,
};
