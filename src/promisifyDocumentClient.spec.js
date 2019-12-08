
jest.doMock('./clientMethods', () => ['foo', 'bar'])
const methods = require('./clientMethods')

const mockClient = (method = 'attack') => ({
  [method]: () => ({ promise: async () => 1337 }),
})

const promisifyDocumentClient = require('./promisifyDocumentClient')

it.each(methods)('makes %s() return a promise', async (method) => {
  const client = mockClient(method)
  promisifyDocumentClient(client)

  const clientCall = client[method]()

  expect(clientCall).toBeInstanceOf(Promise)
  await expect(clientCall).resolves.toBe(1337)
})

it.each(methods)('proxies calls to original_%s()', async (method) => {
  const client = mockClient(method)
  promisifyDocumentClient(client)
  client[`original_${method}`] = jest.fn(() => ({ promise: async () => 1337 }))

  const clientCall = client[method]()
  await clientCall

  expect(client[`original_${method}`]).toHaveBeenCalled()
})
