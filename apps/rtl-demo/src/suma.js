export function suma(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new TypeError('Se requieren numeros finitos');
  }
  return a + b;
}
