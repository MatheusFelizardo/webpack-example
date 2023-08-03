const path = require('path');
const fs = require('fs');

function getJsFilesInDirectory(dir) {
  let fileNames = [];
  fs.readdirSync(dir).forEach(subDir => {
      if (subDir.includes('.js')) {
          return fileNames.push(`${dir}/${subDir}`)
      }

      fs.readdirSync(`${dir}/${subDir}`).forEach(file => {
          if (file.includes('.js')) {
              fileNames.push(`${dir}/${subDir}/${file}`)
          }
      })
  });

  return fileNames;
}

const jsParser = (option) => { 
 return getJsFilesInDirectory(option);
}

module.exports = { jsParser }