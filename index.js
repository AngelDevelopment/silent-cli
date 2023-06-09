const fs = require('fs');
const fsExtra = require('fs-extra');
const axios = require('axios').default;
const query = process.argv.slice(2).join(' ');
const readline = require('node:readline');
const ProgressBar = require('multi-progress');
const dotenv = require('dotenv');
const { promisify } = require('util');
const write = promisify(fs.writeFile);
const { setTimeout: wait } = require('timers/promises');
const clc = require('cli-color');

const scurl = require('./scurl');

dotenv.config();

const { TEST_URL } = process.env;

const silent_url = TEST_URL || `https://silent-cloud-api-render.onrender.com/get`;
const IS_TEST_ENV = TEST_URL ? true : false;

console.clear();
console.log(IS_TEST_ENV ? clc.red('⬤ NOT ENCRYPTED') : clc.green('⬤ ENCRYPTED'));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const input = text => new Promise(resolve => rl.question(`${text} `, a => {
     resolve(a);
}));

if (query.trim() === '') return console.log(`No se ha proporcionado una búsqueda`);

const encript1 = query => JSON.stringify(Buffer.from(query).toJSON().data.map(i => i * 152));
const decript1 = data => Buffer.from(JSON.parse(data).map(i => i / 152)).toString();
const decript2 = data => Buffer.from(data.map(i => i / 3));

(async () => {
     if (fs.existsSync('./data/')) {
          fsExtra.emptyDirSync('./data/');
     } else {
          fs.mkdirSync('./data/');
     }

     let amount = parseInt(await input(`Cantidad de solicitudes (Por defecto 5):`));
     let gif = (await input(`Gif (y/n):`)) === 'y' ? true : false;

     const search_data = {
          query,
          amount,
          isGif: gif,
          content: []
     };

     const search_encript = encript1(JSON.stringify(search_data));
     const basic_data_encript = (data) => JSON.stringify(Buffer.from(JSON.stringify(data)).toJSON().data.map(e => e * 7));
     const basic_data_decript = (data) => JSON.parse(Buffer.from(JSON.parse(data).map(e => e / 7)).toString());

     fs.writeFileSync('.encripted-search', search_encript);

     fs.writeFileSync('.encripted-basic-data', basic_data_encript([]));

     const search_updater = (object) => {
          const data = JSON.parse(decript1(fs.readFileSync('.encripted-search').toString()));
          const final_content = data.content;

          final_content.push(object);

          fs.writeFileSync('.encripted-search', encript1(JSON.stringify({
               ...data,
               content: final_content
          })));
     }

     rl.close();

     let success = 0;

     if (isNaN(amount)) amount = 5;

     const multi = new ProgressBar(process.stderr);

     console.clear();

     const bar = multi.newBar('Descargando [:bar] :percent', {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: amount
     });

     for (let i = 0; i < amount; i++) {
          let m = null;

          let data = null;

          try {
               data = (await axios.get(silent_url, {
                    params: {
                         q: encript1(query),
                         i,
                         gif
                    }
               })).data;

               const response = JSON.parse(decript2(data).toString());
               let filename = (new URL(response.original)).pathname.split('/').pop();
               // if (filename.split('.').pop() === '') filename = filename + '.png';

               const extension = gif ? '.gif' : '.png';

               if (filename.split('.').pop() === filename) {
                    if (gif) {
                         filename = filename + '.gif';
                    } else {
                         filename = filename + '.png';
                    }
               }

               const data_content = fs.readdirSync('./data');
               if (data_content.includes(filename)) {
                    const index = data_content.filter(f => f.startsWith(filename.split('.').slice(0, -1))).length;

                    filename = filename.split('.').slice(0, -1) + `(${index}).` + filename.split('.').slice(-1);
               }

               await write(`./data/${filename}`, await scurl(response.original));

               success++;

               const basic_data = basic_data_decript(fs.readFileSync('.encripted-basic-data').toString());

               basic_data.push({
                    filename,
                    original: response.original,
                    title: response.title
               })

               fs.writeFileSync('.encripted-basic-data', basic_data_encript(basic_data));

               m = `\n✅ SUCCESS | DOWNLOADED ${success}/${amount} IMAGES | ${amount - i - 1} REQUESTS LEFT`;

          } catch (e) {
               if(IS_TEST_ENV) throw e;

               let error = null;
               try {
                    error = JSON.parse(decript2(e.response.data).toString());
                    // console.log(error);

                    // if (TEST_URL) console.error(error);
               } catch {

               }

               m = `\n❌ ERROR | DOWNLOADED ${success}/${amount} IMAGES | ${amount - i - 1} REQUESTS LEFT`;

               if (error) {
                    m += `\nMESSAGE: ${error.error}\tIMAGES_LENGTH: ${error.images_length}`;
                    if (i >= error.images_length) {
                         console.log(m.split('\n').slice(1).join('\n'));
                         process.exit();
                    }
               }
          }

          console.clear();

          bar.tick();
          console.log(m);

          if (m.includes('ERROR')) {
               await wait(1 * 1000);
          }

          if (i + 1 !== amount) await wait(2 * 1000);
     }

     console.log(`Se han descargado ${success}/${amount} archivos (${success / amount * 100}%)`);

     process.exit();
})();