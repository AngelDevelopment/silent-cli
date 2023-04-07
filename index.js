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

dotenv.config();

const { TEST_URL } = process.env;

const silent_url = TEST_URL || `https://silent-cloud-api-render.onrender.com/get`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const input = text => new Promise(resolve => rl.question(`${text} `, a => {
     resolve(a);
}));

if (query.trim() === '') return console.log(`No se ha proporcionado una búsqueda`);

const encript1 = query => JSON.stringify(Buffer.from(query).toJSON().data.map(i => i * 152));
const decript1 = data => Buffer.from(JSON.parse(data).map(i => i / 152)).toString();
const decript2 = data => Buffer.from(data.buffer.map(i => i / 1235));

(async () => {
     if (fs.existsSync('./data/')) {
          fsExtra.emptyDirSync('./data/');
     } else {
          fs.mkdirSync('./data/');
     }

     let amount = parseInt(await input(`Cantidad de solicitudes (Por defecto 5):`));
     let gif = (await input(`Gif (y/n):`)) === 'y' ? 'true' : 'false';

     const search_data = {
          query,
          amount,
          isGif: gif,
          content: []
     };

     const search_encript = encript1(JSON.stringify(search_data));
     fs.writeFileSync('.encripted-search', search_encript);

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

          try {
               const { data } = await axios.get(silent_url, {
                    params: {
                         q: encript1(query),
                         i,
                         gif
                    }
               });

               const buffer = decript2(data);
               let filename = (new URL(data.original)).pathname.split('/').pop();
               if (filename.split('.').pop() === '') filename = filename + '.png';

               await write(`./data/${filename}`, buffer);

               success++;
               m = `\n✅ SUCCESS | DOWNLOADED ${success}/${amount} IMAGES | ${amount - i - 1} REQUESTS LEFT`;
          } catch (e) {
               if(TEST_URL) throw e;
               
               m = `\n❌ ERROR | DOWNLOADED ${success}/${amount} IMAGES | ${amount - i - 1} REQUESTS LEFT`;
          }

          console.clear();

          bar.tick();
          console.log(m);
          if (i + 1 !== amount) await wait(2 * 1000);
     }

     console.log(`Se han descargado ${success}/${amount} archivos (${success / amount * 100}%)`);

     process.exit();
})();