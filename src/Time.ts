export function now(): number {
  const ts = process.hrtime()
  return 1000 * (ts[0] + 1e-9 * ts[1])
}

export function fixed3(value: number): number {
  return Math.round(value * 1000) / 1000
}
