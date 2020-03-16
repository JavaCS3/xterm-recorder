export function now(): number {
  const ts = process.hrtime()
  return ts[0] + 1e-9 * ts[1]
}

export function fixed7(value: number): number {
  return Math.round(value * 1e7) / 1e7
}
