// Levenshtein formula for determining the minimum number of changes to reach the same string
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // swap to save some memory O(min(a,b)) instead of O(a)
  if (a.length > b.length) {
    const tmp = a;
    a = b; //eslint-disable-line
    b = tmp; //eslint-disable-line
  }
  const row = [];
  for (let i = 0; i <= a.length; i += 1) {
    row[i] = i;
  }
  // fill in the rest
  for (let i = 1; i <= b.length; i += 1) {
    let prev = i;
    for (let j = 1; j <= a.length; j += 1) {
      let val;
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        val = row[j - 1]; // match
      } else {
        val = Math.min(row[j - 1] + 1, // substitution
                       prev + 1,     // insertion
                       row[j] + 1);  // deletion
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }
  return row[a.length];
}

function compareEntitiesAndDescriptions(entities, descriptions) {
  // Examples of expected parameters
  // entities = [{
  //   name: 'Michelangelo Caravaggio',
  //   type: 'PERSON',
  //   salience: 0.75942981,
  // }];
  // descriptions = [{
  //   ID: 169,
  //   Name: 'Swollen glands on the neck',
  // }];
  const compareResults = [];
  descriptions.forEach((description) => {
    let points = 0;
    entities.forEach((entity) => {
      if (levenshtein(description.Name.toLowerCase(), entity.name.toLowerCase()) <= 3) {
        points = 1000;
        return;
      }
      description.Name.split(' ').forEach((descriptionWord) => {
        entity.name.split(' ').forEach((entityWord) => {
          if (levenshtein(descriptionWord.toLowerCase(), entityWord.toLowerCase()) <= 1) {
            points += 10;
          }
        });
      });
    });
    compareResults.push({
      id: [description.ID],
      points,
    });
  });
  return compareResults.sort((a, b) => b.points - a.points);
}

module.exports = { compareEntitiesAndDescriptions };
