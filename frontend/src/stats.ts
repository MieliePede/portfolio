// Small statistics helpers for the lifespan chart. Checked by tests/stats.test.ts.

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (ys[i] - my) ** 2
  }
  return sxy / Math.sqrt(sxx * syy)
}

/** 25th percentile with linear interpolation (Python's statistics.quantiles(method='inclusive')). */
export function lowerQuartile(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const pos = (s.length - 1) * 0.25
  const lo = Math.floor(pos)
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo)
}
