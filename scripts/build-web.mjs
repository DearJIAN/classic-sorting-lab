/** Sorting Lab V2: verify the offline-first HTML mirror. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const standalone=await readFile(resolve(root,'web/standalone.html'),'utf8');
if(process.argv.includes('--check')){
 const index=await readFile(resolve(root,'web/index.html'),'utf8');
 assert.equal(index,standalone,'web/index.html differs from the standalone source');
 console.log('OK: both web entrypoints match and are offline-ready');
}else{
 await writeFile(resolve(root,'web/index.html'),standalone);
 console.log('Built web/index.html from web/standalone.html');
}
