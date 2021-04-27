
const mockClient = (method = 'batchGet') => {
  const methodMock = jest.fn(async ({ RequestItems }) => {
    const TableName = Object.keys(RequestItems)[0]
    return { Responses: { [TableName]: [] }, UnprocessedKeys: {} }
  })
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const { appendGetAll } = require('./getAll')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('appendGetAll()', () => {
  it('appends getAll() to DocumentClient', () => {
    const client = mockClient()

    appendGetAll(client)

    expect(client).toHaveProperty('getAll')
    expect(client.getAll).toBeInstanceOf(Function)
  })
})

describe('getAll()', () => {
  it('returns a Promise', () => {
    const client = mockClient()
    appendGetAll(client)

    expect(client.getAll()).toBeInstanceOf(Promise)
  })

  it('builds appropriate batchGet params', async () => {
    const client = mockClient()
    appendGetAll(client)

    const TableName = 'Woop woop!'
    const Keys = [{ a: 'b' }, { c: 'd' }]
    await client.getAll({ TableName, Keys })

    expect(client.mockReference.mock.calls[0][0]).toStrictEqual(
      { RequestItems: { [TableName]: { Keys } } }
    )
  })

  it('chunks documents to 100 per batchGet by default', async () => {
    const client = mockClient()
    appendGetAll(client)

    let Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await client.getAll({ Keys })

    expect(client.mockReference).toHaveBeenCalledTimes(Math.ceil(Keys.length / 100))
  })

  it('allows batch size to be overridden', async () => {
    const BatchSize = 10
    const client = mockClient()
    appendGetAll(client)

    let Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await client.getAll({ BatchSize, Keys })

    expect(client.mockReference).toHaveBeenCalledTimes(Math.ceil(Keys.length / 10))
  })

  it('resolves with a compiled list of documents', async () => {
    const BatchSize = 1
    const client = mockClient()
    appendGetAll(client)

    const Keys = [{ foo: 1 }, { bar: 2 }]
    Keys.forEach((document) => {
      client.mockReference.mockResolvedValueOnce({ Responses: { '': [document] }, UnprocessedKeys: {} })
    })

    const results = await client.getAll({ BatchSize, Keys })

    expect(results).toEqual(Keys)
  })
})
