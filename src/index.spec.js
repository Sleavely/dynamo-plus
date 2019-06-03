
jest.doMock('./promisifyDocumentClient')
jest.doMock('./retryableExceptions')

const requireUncached = (moduleName) => {
  delete require.cache[require.resolve(moduleName)]
  return require(moduleName)
}

it('can be loaded without throwing exceptions', () => {
  expect(() => {
    requireUncached(`./index`)
  }).not.toThrow()
})

it('has DynamoPlus property', () => {
  const dp = requireUncached(`./index`)
  expect(dp).toHaveProperty('DynamoPlus')
})

it('DynamoPlus() returns a new DocumentClient', () => {
  const { DynamoPlus } = requireUncached(`./index`)
  const client = DynamoPlus()

  expect(client.constructor.name).toBe('DocumentClient')
})
