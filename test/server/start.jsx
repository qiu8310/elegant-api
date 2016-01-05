/* eslint no-process-exit: 0 */
import { spawn } from 'child_process';
import path from 'path';

import server from './engine';

let karmaBinFile = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'karma');
let testArgs = [karmaBinFile, 'start', '--no-auto-watch', '--single-run'];

function start() {
  let test = spawn('node', testArgs, {stdio: 'inherit'});

  test.on('close', code => {
    server.close(() => {
      process.exit(code);
    });
  });
}

if (server.__uped) {
  start();
} else {
  server.__up = start;
}

