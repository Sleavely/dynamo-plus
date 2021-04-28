
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

describe('DynamoPlus', () => {
  it('returns a new DocumentClient', () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus()

    expect(client.constructor.name).toBe('DocumentClient')
  })
  it('allows custom options', () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus({ potato: 'Hello' })

    expect(client.service.config.potato).toBe('Hello')
  })
  it('defaults to a keepalive-enabled http agent', () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus()

    expect(client.service.config.httpOptions).toMatchObject({ agent: { keepAlive: true } })
  })
})
