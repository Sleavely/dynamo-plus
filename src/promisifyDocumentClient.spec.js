
const promisifyDocumentClient = require('./promisifyDocumentClient')
const methods = require('./clientMethods')

const mockClient = (method = 'attack') => ({
  [method]: () => ({ promise: async () => 1337 })
})

it.each(methods)('makes %s() return a promise', async (method) => {
  const client = mockClient(method)

  promisifyDocumentClient(client)
  const clientCall = client[method]()

  expect(clientCall).toBeInstanceOf(Promise)
  await expect(clientCall).resolves.toBe(1337)
})

it.each(methods)('proxies calls to original_%s()', async (method) => {
  // Woop woop
  throw new Error('jest doesnt have a it.eachTodo() method so here we are')
})

// TODO: move retry-logic to the retryableExceptions file
it.todo('automatically retries when the original throw a known error')
