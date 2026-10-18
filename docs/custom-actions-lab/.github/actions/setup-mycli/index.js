'use strict';

// Fuente de la accion. npm run build:action genera dist/index.js con @actions/core.
const core = require('@actions/core');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SUPPORTED = ['1.2.3', '1.2.4'];
const LATEST = '1.2.4';

function run() {
  try {
    if (process.platform !== 'linux') {
      throw new Error('Esta practica esta preparada para runners Linux.');
    }
    // with.version se recibe como INPUT_VERSION; core aplica la lectura y trim.
    const requested = core.getInput('version') || 'latest';
    const version = requested === 'latest' ? LATEST : requested;
    if (!SUPPORTED.includes(version)) {
      throw new Error('Version no soportada: ' + requested +
        '. Usa 1.2.3, 1.2.4 o latest.');
    }
    if (!process.env.RUNNER_TEMP) {
      throw new Error('Falta RUNNER_TEMP. Para pruebas locales usa npm test.');
    }

    // __dirname es dist/ porque runs.main apunta a dist/index.js.
    // Los assets se encuentran junto a dist, no dentro del bundle.
    const actionRoot = path.resolve(__dirname, '..');
    const binDir = path.join(process.env.RUNNER_TEMP, 'mycli-lab', version, 'bin');
    const executable = path.join(binDir, 'mycli');
    const expectedManifest = fs.readFileSync(
      path.join(actionRoot, 'releases', version, 'package.json'), 'utf8');
    const cliSource = fs.readFileSync(
      path.join(actionRoot, 'cli', 'mycli.cjs'), 'utf8');
    const manifestPath = path.join(binDir, 'package.json');
    const reused = fs.existsSync(executable) && fs.existsSync(manifestPath) &&
      fs.readFileSync(executable, 'utf8') === cliSource &&
      fs.readFileSync(manifestPath, 'utf8') === expectedManifest;

    if (!reused) {
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(executable, cliSource, { mode: 0o755 });
      fs.writeFileSync(manifestPath, expectedManifest);
    }
    fs.chmodSync(executable, 0o755);

    // Verificacion real del programa instalado; sin concatenar un comando shell.
    const actual = execFileSync(process.execPath, [executable, '--version'],
      { encoding: 'utf8' }).trim();
    if (actual !== version) throw new Error('Version instalada inesperada: ' + actual);

    // PATH de este proceso y de los pasos posteriores del MISMO job.
    core.addPath(binDir);
    // core.setOutput escribe en el fichero especifico GITHUB_OUTPUT del paso.
    core.setOutput('version', version);
    core.setOutput('bin-path', binDir);
    core.setOutput('reused', String(reused));
    core.info('Solicitada: ' + requested + '; instalada: ' + version);
    core.info('MyCLI: ' + executable);
    core.info(reused ? 'Instalacion del job reutilizada.' : 'Instalacion local creada.');
    core.debug('Node que ejecuta la accion: ' + process.execPath);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
