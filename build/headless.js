export function createHeadlessThing(value = 0) {
  let v = value;
  return { inc: () => ++v, dec: () => --v, value: () => v };
}