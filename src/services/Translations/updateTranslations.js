const { exec } = require('child_process')

const findStartLine = (splitData) => {
  for (let i = 0; i < splitData.length; i++) {
    if (splitData[i] === 'export default {') {
      return i+1;
    }
  }
}

async function main() {
  console.log('Updating translations...')

  const fs = require('fs');
  const filename = 'src/services/Translations/Locales/English.js';

  let languagesList = [];

  const command = 'ls src/services/Translations/Locales/';
  exec(command, (error, stdout) => {
    if (!!error) {
      console.log(error);
    } else {
      languagesList = stdout.replace('English.js\n','').replace('_helper.js\n','').split('\n');
      languagesList = languagesList.splice(0, languagesList.length - 1);
    }
  })

  fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    const splitEnglish = data.split('\n');
    const englishStart = findStartLine(splitEnglish);

    for (let language in languagesList) {
      fs.readFile('src/services/Translations/Locales/' + languagesList[language], 'utf8', function(err, data) {
        if (err) throw err;
        let splitData = data.split('\n');
        let start = findStartLine(splitData);

        if (splitData.length === 1) {
          splitData = splitEnglish;
          start = findStartLine(splitData);
        }

        let currentLanguagePosition = start;
        let currentEnglishPosition = englishStart;

        while (currentEnglishPosition < splitEnglish.length && currentLanguagePosition < splitData.length && splitEnglish[currentEnglishPosition] !== '}') {
          const currentEnglishLine = splitEnglish[currentEnglishPosition];
          const currentLanguageLine = splitData[currentLanguagePosition];

          if (currentEnglishLine === '' && currentLanguageLine === '') {
            currentEnglishPosition += 1;
            currentLanguagePosition += 1;
          }
          else if (currentEnglishLine !== '}' && currentLanguageLine === '}') {
            if (currentEnglishLine === '') {
              splitData.splice(currentLanguagePosition, 0, currentEnglishLine);
            }
            else {
              splitData.splice(currentLanguagePosition, 0, currentEnglishLine + ' //TODO');
            }
            currentEnglishPosition += 1;
            currentLanguagePosition += 1;
          }
          else if (currentEnglishLine === '') {
            //currentEnglishPosition += 1;
            currentLanguagePosition += 1;
          }
          else if (currentLanguageLine === '') {
            splitData.splice(currentLanguagePosition, 0, currentEnglishLine + ' //TODO');
            currentEnglishPosition += 1;
            currentLanguagePosition += 1;
          }
          else {
            const englishKey = currentEnglishLine.split(': ')[0].replace('\'', '');
            const languageKey = currentLanguageLine.split(': ')[0].replace('\'', '');

            if (currentEnglishLine === currentLanguageLine) {
              splitData[currentLanguagePosition] = splitData[currentLanguagePosition] + ' //TODO';
              currentEnglishPosition += 1;
              currentLanguagePosition += 1;
            }
            else if (currentEnglishLine === currentLanguageLine.replace(' //TODO', '')) {
              currentEnglishPosition += 1;
              currentLanguagePosition += 1;
            }
            else if (englishKey === languageKey) {
              splitData[currentLanguagePosition] = splitData[currentLanguagePosition].replace(' //TODO', '');
              currentEnglishPosition += 1;
              currentLanguagePosition += 1;
            }
            else {
              splitData.splice(currentLanguagePosition, 0, currentEnglishLine + ' //TODO');
              currentEnglishPosition += 1;
              currentLanguagePosition += 2;
            }
          }
        }

        fs.writeFile('src/services/Translations/Locales/' + languagesList[language] , splitData.join('\n'), function(err) {
          if (err) return console.log(err);
        })
      });
    }
  });
}

main().then(() => {
  console.log('Translations updated');
})
