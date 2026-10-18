#!/usr/bin/env node
'use strict';

// Esta es LA CLI instalada. Es un programa didactico, no Azure CLI ni GitHub CLI.
const fs = require('node:fs');
const { version } = require('./package.json');
const [command, ...args] = process.argv.slice(2);

try {
  if (command === '--version') {
    console.log(version);
  } else if (command === 'greet') {
    console.log('Hola, ' + (args.join(' ') || 'mundo') + '! MyCLI ' + version);
  } else if (command === 'validate-json') {
    if (args.length !== 1) throw new Error('Uso: mycli validate-json ARCHIVO');
    JSON.parse(fs.readFileSync(args[0], 'utf8'));
    console.log('JSON valido: ' + args[0]);
  } else if (command === '--help' || !command) {
    console.log('MyCLI ' + version);
    console.log('Comandos: --version | greet NOMBRE | validate-json ARCHIVO');
  } else {
    throw new Error('Comando desconocido: ' + command);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
