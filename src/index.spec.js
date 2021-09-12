
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

  it('defaults to using a keepalive-enabled https agent', () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus()

    const clientConfig = client.service.config
    const apiRequest = client.get({ TableName: 'test', Key: { id: 'test' } })

    expect(clientConfig.httpOptions).toMatchObject({ agent: { keepAlive: true } })
    expect(apiRequest).toMatchObject({ service: { config: { httpOptions: { agent: { keepAlive: true } } } } })
  })

  it('does not set an agent if a custom endpoint is defined', async () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus({ region: 'eu-west-1', endpoint: 'http://localhost:7171/' })

    const clientConfig = client.service.config
    const apiRequest = client.get({ TableName: 'test', Key: { id: 'test' } })

    expect(clientConfig.httpOptions).toMatchObject({ agent: undefined })
    expect(apiRequest).toMatchObject({ service: { config: { httpOptions: { agent: undefined } } } })
  })

  it('allows an explicitly undefined http(s) agent', async () => {
    const { DynamoPlus } = requireUncached(`./index`)

    const client = DynamoPlus({ region: 'eu-west-1', httpOptions: { agent: undefined } })

    const clientConfig = client.service.config
    const apiRequest = client.get({ TableName: 'test', Key: { id: 'test' } })

    expect(clientConfig.httpOptions).toMatchObject({ agent: undefined })
    expect(apiRequest).toMatchObject({ service: { config: { httpOptions: { agent: undefined } } } })
  })
})
