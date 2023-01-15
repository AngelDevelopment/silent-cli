const fs = require('fs');
const fsExtra = require('fs-extra');
const axios = require('axios').default;
const query = process.argv.slice(2).join(' ');
const readline = require('node:readline');
const ProgressBar = require('multi-progress');

const silent_url = `https://silent-cloud-project-cloud.cyclic.app/get`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const input = text => new Promise(resolve => rl.question(`${text} `, a => {
     resolve(a);
     rl.close()
}));

if (query.trim() === '') return console.log(`No se ha proporcionado una búsqueda`);

(async () => {
     if (fs.existsSync('./data/')) {
          fsExtra.emptyDirSync('./data/');
     } else {
          fs.mkdirSync('./data/');
     }

     let amount = parseInt(await input(`Cantidad de archivos (Por defecto 5):`));
     let success = 0;

     if (isNaN(amount)) amount = 5;

     const multi = new ProgressBar(process.stderr);

     console.clear();

     const bar = multi.newBar('Descargando [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: amount
     });

     for (let i = 0; i < amount; i++) {
          try {
               const { data } = await axios.get(silent_url, {
                    params: {
                         q: JSON.stringify(Buffer.from(query).toJSON().data.map(i => i * 152)),
                         i
                    }
               });

               const buffer = Buffer.from(data.buffer.map(i => i / 1235));
               let filename = (new URL(data.original)).pathname.split('/').pop();
               if (filename.split('.').pop() === '') filename = filename + '.png';

               fs.writeFileSync(`./data/${filename}`, buffer);

               console.log(``)

               success++;
          } catch (e) {
               console.log('ERROR');
          }

          console.clear();

          bar.tick();
     }

     console.log(`Se han descargado ${success}/${amount} archivos (${success / amount * 100}%)`);

     process.exit();
})();