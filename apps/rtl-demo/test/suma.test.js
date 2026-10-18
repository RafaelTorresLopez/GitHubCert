import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suma } from '../src/suma.js';
test('suma enteros positivos', () => assert.equal(suma(2, 3), 5));
test('suma negativos y cero', () => assert.equal(suma(-2, 0), -2));
test('rechaza entradas no numericas', () => assert.throws(() => suma('2', 3), TypeError));
test('rechaza infinito', () => assert.throws(() => suma(Infinity, 1), TypeError));
