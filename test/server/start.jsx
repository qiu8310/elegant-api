/* eslint no-process-exit: 0 */
import { spawn } from 'child_process';
import path from 'path';

import feServer from './fe-server';
import rdServer from './rd-server';

let karmaBinFile = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'karma');
let testArgs = [karmaBinFile, 'start', '--no-auto-watch', '--single-run'];

function start() {
  if (!feServer.__uped || !rdServer.__uped) return false;

  let test = spawn('node', testArgs, {stdio: 'inherit'});

  test.on('close', code => {
    process.exit(code);
  });
}

function wrapServer(server) {
  if (server.__uped) {
    start();
  } else {
    server.__up = start;
  }
}

wrapServer(feServer);
wrapServer(rdServer);



