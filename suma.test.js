const test = require('node:test');
const assert = require('node:assert/strict');
const { suma } = require('./suma');

test('suma dos numeros', () => {
  assert.equal(suma(2, 3), 5);
});

test('suma con numeros negativos', () => {
  assert.equal(suma(-2, 3), 1);
});
