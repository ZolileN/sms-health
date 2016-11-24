require('dotenv').config({ silent: true });

const request = require('request');
const CryptoJS = require('crypto-js');
const log = require('../helpers/logging-helper');

const baseUrl = process.env.API_MEDIC_SANDBOX ? 'https://sandbox-healthservice.priaid.ch/' : 'https://healthservice.priaid.ch/';
const language = 'en-gb';
const format = 'json';
let token = '';

function requestToken() {
  const uri = process.env.API_MEDIC_SANDBOX ? 'https://sandbox-authservice.priaid.ch/login' : 'https://authservice.priaid.ch/login';
  const secretKey = process.env.API_MEDIC_SECRET_KEY;
  const computedHash = CryptoJS.HmacMD5(uri, secretKey);
  const computedHashString = computedHash.toString(CryptoJS.enc.Base64);
  const authorizationHeader = `Bearer ${process.env.API_MEDIC_API_KEY}:${computedHashString}`;
  return new Promise((resolve, reject) => {
    request.post({
      url: uri,
      headers: {
        Authorization: authorizationHeader,
      },
    }, (error, response, body) => {
      if (error) {
        log.error(error);
        reject(error);
      } else {
        token = JSON.parse(body).Token;
        resolve();
      }
    });
  });
}

requestToken();

function makeRequest(endpoint) {
  const additionalRequestParameters = `token=${token}&language=${language}&format=${format}`;
  const formattedAdditionalRequestParameters = endpoint.indexOf('?') > 0 ? `&${additionalRequestParameters}` : `?${additionalRequestParameters}`;
  return new Promise((resolve, reject) => {
    const url = baseUrl + endpoint + formattedAdditionalRequestParameters;
    request(url, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (body && (body === '"Missing or invalid token"' || body === '"Invalid token"')) {
        requestToken().then(() => {
          makeRequest(endpoint)
          .then((responseBody) => {
            resolve(responseBody);
          })
          .catch((err) => {
            reject(err);
          });
        });
      } else {
        resolve(body);
      }
    });
  });
}

module.exports = {
  getSymptoms(cb) {
    return makeRequest('symptoms', cb);
  },
  getIssues(cb) {
    return makeRequest('issues', cb);
  },
  getIssuesInfo(issueId, cb) {
    return makeRequest(`issues/${issueId}/info`, cb);
  },
  getDiagnosis(symptoms, gender, yearOfBirth, cb) {
    return makeRequest(`diagnosis?symptoms=${JSON.stringify(symptoms)}&gender=${gender}&year_of_birth=${yearOfBirth}`, cb);
  },
  getSpecialisations(symptoms, gender, yearOfBirth, cb) {
    return makeRequest(`diagnosis/specialisations?symptoms=${JSON.stringify(symptoms)}&gender=${gender}&year_of_birth=${yearOfBirth}`, cb);
  },
  getBodyLocations(cb) {
    return makeRequest('body/locations', cb);
  },
  getBodySublocations(bodyLocationId, cb) {
    return makeRequest(`body/locations/${bodyLocationId}`, cb);
  },
  getBodySublocationSymptoms(bodySublocationId, gender, yearOfBirth, cb) {
    const age = new Date().getFullYear() - yearOfBirth;
    const childGenderDict = {
      male: 'boy',
      female: 'girl',
    };
    const adultGenderDict = {
      male: 'man',
      female: 'woman',
    };
    const classification = age < 12 ? childGenderDict[gender] : adultGenderDict[gender];
    return makeRequest(`symptoms/${bodySublocationId}/${classification}`, cb);
  },
  getProposedSymptoms(symptoms, gender, yearOfBirth, cb) {
    return makeRequest(`symptoms/proposed?symptoms=${JSON.stringify(symptoms)}&gender=${gender}&year_of_birth=${yearOfBirth}`, cb);
  },
  getRedFlag(symptomId, cb) {
    return makeRequest(`redflag?symptomId=${symptomId}`, cb);
  },
};
