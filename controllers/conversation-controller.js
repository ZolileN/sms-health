require('dotenv').config({ silent: true });

const twilio = require('./../models/twilio-model');
const apiMedic = require('./../models/api-medic-model');
// const translate = require('../models/translate-model');
const redis = require('./../models/redis-model');
const cache = require('./../models/cache-model');
const user = require('./../models/user-model');
const stringComparison = require('./../helpers/string-comparison-helper');
const log = require('./../helpers/logging-helper');
const uuid = require('uuid');
const listify = require('listify');
const moment = require('moment');

const messages = {
  greeting: 'Hi, Thank you for using the SMSHealth service.',
  demo: 'This is a demo version of this service and should only be used for testing. Consult a doctor for any medical questions.',
  error: 'We\'re sorry, there was an error processing your request. Please try again later.',
  timeoutError: 'Thank you for using the SMSHealth service. This conversation is older than 24 hours or otherwise unretrievable for security reasons. Please text "HI" to this number to start the conversation again.',
  storedInformation: 'This phone number has previously reported STORED_GENDER as the gender and STORED_AGE as the age. Would you like to continue using this ("Y" or "N")?',
  storedInformationError: 'We\'re sorry, there was an issue processing your response. Please try again using "Y" or "N".',
  age: 'What is your age? Example: 23.',
  ageError: 'We\'re sorry, there was an issue saving your age. Please try again using numbers between 0 and 115.',
  gender: 'What is your gender (male or female)?',
  genderError: 'We\'re sorry, there was an issue saving your gender. Please try again using "male" or "female".',
  symptoms: 'Can you please describe the symptoms you are experiencing?',
  symptomsNoValidResults: 'We\'re sorry, but we couldn\'t find a valid symptom in our database, can you please describe your symptoms in more detail?',
  proposedSymptoms: 'We were unable to correctly diagnosis based on the symptoms provided. Are you experiencing PROPOSED_SYMPTOMS ("Y" or "N")?',
  proposedSymptomsIncorrect: 'We\'re sorry that those symptoms did not match. Can you please describe your symptoms in more detail?',
  proposedSymptomsNoReturn: 'We\'re sorry, but we could not find a matching diagnosis for those symptoms. Could you please describe your symptoms in more detail?',
  redFlag: 'These symptoms: FLAGGED_SYMPTOM_STRING are concerning and should be evaluated by a doctor. Please go to your nearest healthcare provider.',
  diagnosisResults: 'It appears that you may be experiencing DIAGNOSIS_RESULT. This was calculated with a DIAGNOSIS_CERTAINTY % probability.DIAGNOSIS_RESULT_ALTERNATES_STRING If you would like more information about treatment options, respond with "MORE".',
  diagnosisAlternativeResults: ' It could also be DIAGNOSIS_RESULT_ALTERNATES.',
  moreInformation: 'Short description of diagnosis: DIAGNOSIS_INFO. Possible treatment options: DIAGNOSIS_TREATMENT',
  deletedCache: 'Thank you for using SMSHealth, hope you feel better soon!',
};

const correctDiagnosisThreshold = process.env.CORRECT_DIAGNOSIS_THRESHOLD;
const alternativeDiagnosisSimilarityThreshold = process.env.ALTERNATIVE_DIAGNOSIS_SIMILARITY_THRESHOLD;

function checkIfUserGenderAndAgeInDatabase(phoneNumber) {
  return new Promise((resolve, reject) => {
    user.getUserByPhoneNumber(phoneNumber)
    .then((result) => {
      if (result && result.age && result.gender) {
        resolve({
          age: result.age,
          gender: result.gender,
        });
      } else {
        user.createUser(phoneNumber);
      }
    })
    .then(() => {
      resolve(false);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

function validateAndFormatAge(age) {
  const formattedAge = Number.parseInt(age, 10);
  if (Number.isInteger(formattedAge) && formattedAge >= 0 && formattedAge <= 115) {
    return formattedAge;
  }
  return null;
}

function validateAndFormatGender(gender) {
  if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female') {
    return gender.toLowerCase() === 'male' ? 'M' : 'F';
  } else if (gender.toLowerCase() === 'm' || gender.toLowerCase() === 'f') {
    return gender.toLowerCase() === 'm' ? 'M' : 'F';
  }
  return null;
}

function sendProposedSymptoms(comparisons, userLookupResults, yearOfBirth, userId, phoneNumber) {
  apiMedic.getProposedSymptoms(`[${comparisons.map(comparison => `"${comparison.id}"`).join(',')}]`, userLookupResults.gender, yearOfBirth)
  .then((proposedSymptoms) => {
    const parsedProposedSymptoms = JSON.parse(proposedSymptoms);
    if (parsedProposedSymptoms.length > 0) {
      const proposedSymptomsList = listify(parsedProposedSymptoms, { finalWord: 'or' });
      twilio.sendSMSMessage(phoneNumber, messages.proposedSymptoms.replace('PROPOSED_SYMPTOMS', proposedSymptomsList), userId)
      .then(() => {
        redis.setProposedSymptoms(userId, parsedProposedSymptoms);
      });
    } else {
      twilio.sendSMSMessage(phoneNumber, messages.proposedSymptomsNoReturn, userId)
      .then(() => {
        redis.setLastSentMessage(userId, 'proposedSymptomsNoReturn');
      });
    }
  });
}

function handleRedflag(phoneNumber, concerningRedFlagResults, userId) {
  const concerningRedFlagResultsList = (typeof concerningRedFlagResults === 'object') ? listify(concerningRedFlagResults, { finalWord: 'and' }) : concerningRedFlagResults;
  twilio.sendSMSMessage(phoneNumber, messages.redFlag.replace('FLAGGED_SYMPTOM_STRING', concerningRedFlagResultsList), userId)
  .then(() => {
    redis.setLastSentMessage(userId, 'redFlag');
  });
}

function handleDiagnosisResults(phoneNumber, weightedDiagnosisResponse, userId) {
  const diagnosisResults = weightedDiagnosisResponse.map(diagnosis => ({ id: diagnosis.Issue.ID, name: diagnosis.Issue.Name, accuracy: diagnosis.Issue.Accuracy }));
  const alternativeDiagnoses = diagnosisResults.filter((element, index, array) => ((array[0].accuracy - element.accuracy) < alternativeDiagnosisSimilarityThreshold)).slice(1);
  let alternativeDiagnosisMessage = '';
  if (alternativeDiagnoses.length > 0) {
    const diagnosisResultsAlternativeList = (diagnosisResults.length > 2) ? listify(alternativeDiagnoses.map(diagnosis => diagnosis.name), { finalWord: 'or' }) : diagnosisResults[1].name;
    alternativeDiagnosisMessage = messages.diagnosisAlternativeResults.replace('DIAGNOSIS_RESULT_ALTERNATES', diagnosisResultsAlternativeList);
  }
  const diagnosisMessage = messages.diagnosisResults.replace('DIAGNOSIS_RESULT', diagnosisResults[0].name).replace('DIAGNOSIS_CERTAINTY', diagnosisResults[0].accuracy).replace('DIAGNOSIS_RESULT_ALTERNATES_STRING', alternativeDiagnosisMessage);
  twilio.sendSMSMessage(phoneNumber, diagnosisMessage, userId)
  .then(() => {
    redis.setDiagnosis(userId, diagnosisResults);
  });
}

function sendNoValidResults(phoneNumber, userId) {
  twilio.sendSMSMessage(phoneNumber, messages.symptomsNoValidResults, userId)
  .then(() => {
    redis.setLastSentMessage(userId, 'symptomsNoValidResults');
  });
}

function handleSymptoms(phoneNumber, messageBody, userId) {
  apiMedic.getSymptoms().then((results) => {
    const comparisons = stringComparison.compareMessageAndDescriptions(messageBody, JSON.parse(results));
    if (comparisons.length > 0) {
      user.getUserByPhoneNumber(phoneNumber)
      .then((userLookupResults) => {
        if (userLookupResults && userLookupResults.age && userLookupResults.gender) {
          const yearOfBirth = moment().utc().year() - userLookupResults.age;
          apiMedic.getDiagnosis(comparisons.map(comparison => comparison.id), userLookupResults.gender, yearOfBirth)
          .then((diagnosisResults) => {
            const diagnosisResultsAboveThreshold = JSON.parse(diagnosisResults).filter(result => result.Issue.Accuracy > correctDiagnosisThreshold);
            if (diagnosisResultsAboveThreshold.length) {
              const redFlagPromises = diagnosisResultsAboveThreshold.map(result => apiMedic.getRedFlag(result.Issue.ID));
              Promise.all(redFlagPromises)
              .then((result) => {
                const concerningRedFlagResults = [];
                result.forEach((redFlagResult) => {
                  if (redFlagResult !== '' && redFlagResult !== '""') {
                    concerningRedFlagResults.push(redFlagResult);
                  }
                });
                if (concerningRedFlagResults.length > 1) {
                  handleRedflag(phoneNumber, concerningRedFlagResults, userId);
                } else {
                  const parsedDiagnosisResults = JSON.parse(diagnosisResults);
                  handleDiagnosisResults(phoneNumber, parsedDiagnosisResults, userId);
                }
              })
              .catch((err) => {
                log.error(err);
                twilio.sendSMSMessage(phoneNumber, messages.error, userId);
              });
            } else {
              sendProposedSymptoms(comparisons, userLookupResults, yearOfBirth, userId, phoneNumber);
            }
          })
          .catch((err) => {
            log.error(err);
            twilio.sendSMSMessage(phoneNumber, messages.error, userId);
          });
        }
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, userId);
      });
    } else {
      sendNoValidResults(phoneNumber, userId);
    }
  })
  .catch((err) => {
    log.error(err);
    twilio.sendSMSMessage(phoneNumber, messages.error, userId);
  });
}

function handleProposedSymptomsCorrect(phoneNumber, userId) {
  let proposedSymptoms = {};
  redis.getUserDocument(userId)
  .then((userDoc) => {
    proposedSymptoms = userDoc.proposedSymptoms;
    user.getUserByPhoneNumber(phoneNumber);
  })
  .then((userLookupResults) => {
    if (userLookupResults && userLookupResults.age && userLookupResults.gender) {
      const yearOfBirth = moment().utc().year() - userLookupResults.age;
      apiMedic.getDiagnosis(proposedSymptoms.map(symptom => symptom.id), userLookupResults.gender, yearOfBirth)
      .then((diagnosisResults) => {
        const diagnosisResultsAboveThreshold = JSON.parse(diagnosisResults).filter(result => result.Issue.Accuracy > correctDiagnosisThreshold);
        if (diagnosisResultsAboveThreshold.length) {
          const redFlagPromises = diagnosisResultsAboveThreshold.map(result => apiMedic.getRedFlag(result.Issue.ID));
          Promise.all(redFlagPromises)
          .then((result) => {
            const concerningRedFlagResults = JSON.parse(result).reduce(redFlagResult => redFlagResult !== '');
            if (concerningRedFlagResults.length) {
              handleRedflag(phoneNumber, concerningRedFlagResults, userId);
            } else {
              const parsedDiagnosisResults = JSON.parse(diagnosisResults);
              handleDiagnosisResults(phoneNumber, parsedDiagnosisResults, userId);
            }
          })
          .catch((err) => {
            log.error(err);
            twilio.sendSMSMessage(phoneNumber, messages.error, userId);
          });
        } else {
          sendNoValidResults(phoneNumber, userId);
        }
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, userId);
      });
    }
  })
  .catch((err) => {
    log.error(err);
    twilio.sendSMSMessage(phoneNumber, messages.error, userId);
  });
}

function handleProposedSymptomsIncorrect(phoneNumber, userId) {
  twilio.sendSMSMessage(phoneNumber, messages.proposedSymptomsIncorrect, userId)
  .then(() => {
    redis.setLastSentMessage(userId, 'proposedSymptomsIncorrect');
  });
}

function handleMoreInformation(phoneNumber, userId) {
  redis.getUserDocument(userId)
  .then(userDoc => apiMedic.getIssuesInfo(userDoc.diagnosis[0].id))
  .then((moreInfoResponse) => {
    try {
      const parsedMoreInfoResponse = JSON.parse(moreInfoResponse);
      twilio.sendSMSMessage(phoneNumber, messages.moreInformation.replace('DIAGNOSIS_INFO', parsedMoreInfoResponse.DescriptionShort).replace('DIAGNOSIS_TREATMENT', parsedMoreInfoResponse.TreatmentDescription), userId);
    } catch (err) {
      throw err;
    }
  })
  .then(() => {
    redis.setLastSentMessage(userId, 'moreInformation');
  })
  .then(() => {
    cache.delete(phoneNumber);
  })
  .catch((err) => {
    log.error(err);
    twilio.sendSMSMessage(phoneNumber, messages.error, userId);
  });
}

function handleConversation(req) {
  return new Promise((resolve, reject) => {
    if (!req.body) {
      reject();
      return;
    }
    const phoneNumber = req.body.From;
    const userId = cache.get(phoneNumber);
    const messageBody = req.body.Body;
    if (phoneNumber && messageBody.toLowerCase() === 'hi') {
      // create user Id
      const newUserId = uuid.v4();
      cache.set(phoneNumber, newUserId);
      redis.setUserDocument(newUserId, {}, true)
      .then(() => redis.addConversationMessage(newUserId, messageBody, 'incoming'))
      .then(() => {
        // send greeting message
        if (process.env.DEMO) {
          twilio.sendSMSMessage(phoneNumber, `${messages.greeting} ${messages.demo}`, newUserId);
        } else {
          twilio.sendSMSMessage(phoneNumber, messages.greeting, newUserId);
        }
      })
      .then(() => checkIfUserGenderAndAgeInDatabase(phoneNumber))
      .then((results) => {
      // check if user's stored information exists in database
        if (results && results.age && results.gender) {
          const formattedGender = results.gender === 'M' ? 'Male' : 'Female';
          twilio.sendSMSMessage(phoneNumber, messages.storedInformation.replace('STORED_GENDER', formattedGender).replace('STORED_AGE', results.age), newUserId)
          .then(() => {
            redis.setLastSentMessage(newUserId, 'storedInformation');
          })
          .then(() => resolve())
          .catch((err) => {
            log.error(err);
            reject();
          });
        } else {
          twilio.sendSMSMessage(phoneNumber, messages.age, newUserId)
          .then(() => {
            redis.setLastSentMessage(newUserId, 'age');
          })
          .then(() => resolve())
          .catch((err) => {
            log.error(err);
            reject();
          });
        }
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, newUserId);
        reject();
      });
    } else if (phoneNumber && userId && messageBody.toLowerCase() === 'bye') {
      cache.delete(phoneNumber);
      redis.addConversationMessage(userId, messageBody, 'incoming')
      .then(() => {
        twilio.sendSMSMessage(phoneNumber, messages.deletedCache, userId);
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, userId);
        reject();
      });
    } else if (phoneNumber && userId) {
      let userDoc = {};
      cache.extendTTL(phoneNumber);
      redis.addConversationMessage(userId, messageBody, 'incoming')
      .then(() => redis.getUserDocument(userId))
      .then((userDocument) => {
        userDoc = userDocument;
        switch (userDoc.lastSentMessage) {
          case 'age':
          case 'ageError': {
            const validatedAge = validateAndFormatAge(messageBody);
            if (validatedAge) {
              return user.updateUsersAge(phoneNumber, validatedAge)
              .then(() => twilio.sendSMSMessage(phoneNumber, messages.gender, userId))
              .then(() => {
                redis.setLastSentMessage(userId, 'gender');
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.ageError, userId)
            .then(() => {
              redis.setLastSentMessage(userId, 'ageError');
            });
          }
          case 'gender':
          case 'genderError': {
            const validatedGender = validateAndFormatGender(messageBody);
            if (validatedGender) {
              return user.updateUsersGender(phoneNumber, validatedGender)
              .then(() => twilio.sendSMSMessage(phoneNumber, messages.symptoms, userId))
              .then(() => {
                redis.setLastSentMessage(userId, 'symptoms');
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.genderError, userId)
            .then(() => {
              redis.setLastSentMessage(userId, 'genderError');
            });
          }
          case 'storedInformation':
          case 'storedInformationError': {
            if (messageBody.toLowerCase() === 'y' || messageBody.toLowerCase() === 'yes') {
              return twilio.sendSMSMessage(phoneNumber, messages.symptoms, userId)
              .then(() => {
                redis.setLastSentMessage(userId, 'symptoms');
              });
            } else if (messageBody.toLowerCase() === 'n' || messageBody.toLowerCase() === 'no') {
              return twilio.sendSMSMessage(phoneNumber, messages.age, userId)
              .then(() => {
                redis.setLastSentMessage(userId, 'age');
              });
            }
            return twilio.sendSMSMessage(phoneNumber, messages.storedInformationError, userId);
          }
          case 'symptoms':
          case 'symptomsNoValidResults':
          case 'proposedSymptomsNoReturn':
            if (messageBody) {
              return handleSymptoms(phoneNumber, messageBody, userId);
            }
            break;
          case 'proposedSymptoms':
            if (messageBody.toLowerCase() === 'y') {
              handleProposedSymptomsCorrect();
            } else if (messageBody.toLowerCase() === 'n') {
              handleProposedSymptomsIncorrect();
            } else {
              return twilio.sendSMSMessage(phoneNumber, messages.error, userId);
            }
            break;
          case 'diagnosisResults':
            if (messageBody.toLowerCase() === 'more') {
              handleMoreInformation(phoneNumber, userId);
            } else {
              return twilio.sendSMSMessage(phoneNumber, messages.error, userId);
            }
            break;
          default:
            return twilio.sendSMSMessage(phoneNumber, messages.error, userId);
        }
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        log.error(err);
        twilio.sendSMSMessage(phoneNumber, messages.error, userId);
        reject();
      });
    } else if (phoneNumber && !userId && messageBody.toLowerCase !== 'hi') {
      twilio.sendSMSMessage(phoneNumber, messages.timeoutError);
      resolve();
    }
  });
}

module.exports = {
  handleConversation,
};
