import { it, expect } from 'vitest'
import { chunk } from './chunk'

it('exports a chunk method', async () => {
  expect(chunk).to.be.instanceOf(Function)
})

it('splits an array into chunks', async () => {
  const original = [1, 2, 3, 4, 5]

  let chunked = chunk(original, 2)
  expect(chunked).to.have.length(3)
  expect(chunked[0][0]).to.equal(1)
  expect(chunked[0][1]).to.equal(2)
  expect(chunked[1][0]).to.equal(3)
  expect(chunked[1][1]).to.equal(4)
  expect(chunked[2][0]).to.equal(5)

  chunked = chunk(original, 1)
  expect(chunked).to.have.length(5)

  chunked = chunk(original, 10)
  expect(chunked).to.have.length(1)
})

it('does not modify the original array', async () => {
  const original = ['abc', '123']
  const chunked = chunk(original, 1)
  expect(original).to.have.length(2)
  expect(chunked).to.have.length(2)
  expect(chunked[0][0]).to.equal('abc')
})
