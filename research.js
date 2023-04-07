const fs = require('fs');
const fsExtra = require('fs-extra');
const decript = require('./decript');

const search = decript();

console.log({ query: search.query, amount: search.amount, isGif: search.isGif });

// if (fs.existsSync('./data/')) {
//      fsExtra.emptyDirSync('./data/');
// } else {
//      fs.mkdirSync('./data/');
// }

// for(const image of search.content) {
//      const buffer = Buffer.from(image.buffer.data);
//      fs.writeFileSync(`./data/${image.filename}`, buffer);
// }