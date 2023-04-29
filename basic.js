const fs = require('fs');
const path = require('path');

const query = process.argv.slice(2).join(' ');

const basic_data_decript = (data) => JSON.parse(Buffer.from(JSON.parse(data).map(e => e / 7)).toString());
const decript = () => {
     const encripted_search = fs.readFileSync('.encripted-basic-data').toString();
     const decripted = basic_data_decript(encripted_search);
          
     return decripted;
};

module.exports = decript;

if (query.trim() === '') {
     console.log(decript());
} else {
     if(fs.existsSync(path.join(__dirname, './data/', query.trim()))) {
          console.log(decript().filter(e => e.filename === query.trim()))
     } else {
          console.error('El archivo proporcionado no existe');
     }
}