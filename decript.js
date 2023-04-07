const fs = require('fs');

const decript1 = data => Buffer.from(JSON.parse(data).map(i => i / 152)).toString();

module.exports = () => {
     const encripted_search = fs.readFileSync('.encripted-search').toString();
     const decripted = JSON.parse(decript1(encripted_search));
     
     return decripted;
}