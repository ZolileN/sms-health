require('dotenv').config();

const request = require('request');

const baseUrl = 'https://sandbox-healthservice.priaid.ch/';
const language = 'en-gb';
const format = 'json';
const token = process.env.APIMEDIC_TOKEN;


const additionalRequestParameters = `token=${token}&language=${language}&format=${format}`;

function makeRequest(endpoint) {
  const formattedAdditionalRequestParameters = endpoint.indexOf('?') > 0 ? `&${additionalRequestParameters}` : `?${additionalRequestParameters}`;
  return new Promise((resolve, reject) => {
    request(baseUrl + endpoint + formattedAdditionalRequestParameters, (error, response, body) => {
      if (error) {
        reject(error);
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
