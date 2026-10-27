export function createRandom() {
  const values = new Uint32Array(128);
  let index = values.length;
  return () => {
    if (index === values.length) {
      crypto.getRandomValues(values);
      index = 0;
    }
    return values[index++] / 4294967296;
  };
}
