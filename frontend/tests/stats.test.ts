// Run: node tests/stats.test.ts   (Node 22.18+ runs TypeScript directly)
import assert from 'node:assert/strict'
import {lowerQuartile, pearson} from '../src/stats.ts'

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

close(pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1)
close(pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1)
// matches Python: statistics.correlation([1,2,3,4,5], [2,1,4,3,5]) == 0.8
close(pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 5]), 0.8)

// matches Python: statistics.quantiles(data, n=4, method='inclusive')[0]
close(lowerQuartile([1, 2, 3, 4, 5]), 2)
close(lowerQuartile([4, 1, 3, 2]), 1.75) // unsorted input, interpolated
close(lowerQuartile([7]), 7)

console.log('stats.test: all passed')
