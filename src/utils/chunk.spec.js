
const chunk = require('./chunk')

it('exports a method', async () => {
  expect(chunk).toBeInstanceOf(Function)
})

it('splits an array into chunks', async () => {
  const original = [1, 2, 3, 4, 5]

  let chunked = chunk(original, 2)
  expect(chunked).toHaveLength(3)
  expect(chunked[0][0]).toEqual(1)
  expect(chunked[0][1]).toEqual(2)
  expect(chunked[1][0]).toEqual(3)
  expect(chunked[1][1]).toEqual(4)
  expect(chunked[2][0]).toEqual(5)

  chunked = chunk(original, 1)
  expect(chunked).toHaveLength(5)

  chunked = chunk(original, 10)
  expect(chunked).toHaveLength(1)
})

it('does not modify the original array', async () => {
  const original = ['abc', '123']
  const chunked = chunk(original, 1)
  expect(original).toHaveLength(2)
  expect(chunked).toHaveLength(2)
  expect(chunked[0][0]).toEqual('abc')
})
