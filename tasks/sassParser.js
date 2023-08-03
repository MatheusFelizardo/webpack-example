const path = require('path');
const fs = require('fs');

function getScssFilesInDirectory(dir) {
  let fileNames = [];
  fs.readdirSync(dir).forEach(subDir => {
    if (subDir.includes('.scss')) {
      return fileNames.push(`${dir}/${subDir}`)
    }

    fs.readdirSync(`${dir}/${subDir}`).forEach(file => {
      if (file.includes('.scss')) {
        fileNames.push(`${dir}/${subDir}/${file}`)
      }
    })
  });

  return fileNames;
}

const sassParser = (option) => { 
 return getScssFilesInDirectory(option);
}

module.exports = { sassParser }