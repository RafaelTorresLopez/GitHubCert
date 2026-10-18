'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const bundle = path.join(root, '.github/actions/setup-mycli/dist/index.js');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mycli-action-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function invoke(dir, version) {
  const output = path.join(dir, 'output-' + Math.random());
  const githubPath = path.join(dir, 'path-' + Math.random());
  fs.writeFileSync(output, '');
  fs.writeFileSync(githubPath, '');
  const result = spawnSync(process.execPath, [bundle], {
    encoding: 'utf8',
    env: { ...process.env, INPUT_VERSION: version, RUNNER_TEMP: dir,
      GITHUB_OUTPUT: output, GITHUB_PATH: githubPath }
  });
  return { ...result, outputs: fs.readFileSync(output, 'utf8'),
    paths: fs.readFileSync(githubPath, 'utf8') };
}
for (const [requested, expected] of [['1.2.3', '1.2.3'], ['1.2.4', '1.2.4'], ['latest', '1.2.4'], ['', '1.2.4']]) {
  test('Instalar ' + (requested || '(entrada vacia)') + ' y ejecutar CLI desde PATH', t => {
    const dir = fixture(t);
    const result = invoke(dir, requested);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const bin = path.join(dir, 'mycli-lab', expected, 'bin');
    assert.ok(result.paths.includes(bin));
    assert.ok(result.outputs.includes(expected));
    const cli = spawnSync('mycli', ['--version'], {
      encoding: 'utf8', env: { ...process.env, PATH: bin + ':' + process.env.PATH }
    });
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(cli.stdout.trim(), expected);
    const valid = spawnSync(path.join(bin, 'mycli'),
      ['validate-json', path.join(root, 'ejemplos/aplicacion.json')], { encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    const badJson = path.join(dir, 'invalid.json');
    fs.writeFileSync(badJson, '{no es JSON}');
    assert.equal(spawnSync(path.join(bin, 'mycli'), ['validate-json', badJson]).status, 1);
  });
}
test('Reutilizar y reparar la instalacion del mismo job', t => {
  const dir = fixture(t);
  assert.equal(invoke(dir, '1.2.3').status, 0);
  const second = invoke(dir, '1.2.3');
  assert.equal(second.status, 0);
  assert.match(second.stdout, /reutilizada/);
  fs.writeFileSync(path.join(dir, 'mycli-lab/1.2.3/bin/mycli'), 'archivo corrupto');
  const repaired = invoke(dir, '1.2.3');
  assert.equal(repaired.status, 0);
  assert.match(repaired.stdout, /creada/);
});
test('Rechazar version inexistente y entrada que intenta ejecutar shell', t => {
  const dir = fixture(t);
  for (const value of ['9.9.9', '../escape', '1.2.3; touch marker']) {
    const result = invoke(dir, value);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Version no soportada/);
    assert.equal(result.paths, '');
  }
  assert.equal(fs.existsSync(path.join(dir, 'mycli-lab')), false);
});
test('Entrypoint Docker: saludo y salida sin construir contenedor', t => {
  const dir = fixture(t);
  const output = path.join(dir, 'docker-output');
  fs.writeFileSync(output, '');
  const result = spawnSync('sh',
    [path.join(root, '.github/actions/saludo-docker/entrypoint.sh'), 'Rafael'],
    { encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: output } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(output, 'utf8').trim(),
    'mensaje=Hola, Rafael desde una accion Docker');
});
