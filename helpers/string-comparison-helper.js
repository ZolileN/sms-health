const natural = require('natural');
const stringSimilarity = require('string-similarity');

const minimumPointsValue = process.env.MINIMUM_POINTS_VALUE_FOR_COMPARISON;

function getImportanceOfWordsInString(string) {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  tfidf.addDocument(string);
  const wordImportance = [];
  string.split(' ').forEach((word) => {
    tfidf.tfidfs(word, (i, measure) => {
      wordImportance.push({
        word,
        importance: measure,
      });
    });
  });
  return wordImportance.sort((a, b) => b.importance - a.importance);
}

function compareMessageAndDescriptions(message, descriptions) {
  const compareResults = [];
  const importantWords = getImportanceOfWordsInString(message).filter(word => word.importance > 0);
  descriptions.forEach((description) => {
    let points = 0;
    importantWords.forEach((importantWord) => {
      const similarity = stringSimilarity.compareTwoStrings(
        description.Name.toLowerCase(),
        importantWord.word.toLowerCase());
      points += (100 / importantWords.length) * similarity;
    });
    compareResults.push({
      id: [description.ID],
      points,
    });
  });
  return compareResults.filter(comparison => comparison.points > (minimumPointsValue / importantWords.length)).sort((a, b) => b.points - a.points);
}

module.exports = { compareMessageAndDescriptions };
