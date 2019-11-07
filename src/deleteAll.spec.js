
const mockClient = (method = 'batchWrite') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const { appendDeleteAll } = require('./deleteAll')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('appendDeleteAll()', () => {
  it('appends deleteAll() to DocumentClient', () => {
    const client = mockClient()

    appendDeleteAll(client)

    expect(client).toHaveProperty('deleteAll')
    expect(client.deleteAll).toBeInstanceOf(Function)
  })
})

describe('deleteAll()', () => {
  it('returns a Promise', () => {
    const client = mockClient()
    appendDeleteAll(client)

    expect(client.deleteAll()).toBeInstanceOf(Promise)
  })

  it('builds appropriate batchWrite params', async () => {
    const client = mockClient()
    appendDeleteAll(client)

    const TableName = 'Woop woop!'
    const Keys = [{ a: 'b' }, { c: 'd' }]
    await client.deleteAll({ TableName, Keys })

    expect(client.mockReference.mock.calls[0][0]).toStrictEqual(
      { RequestItems: { [TableName]: [
        { DeleteRequest: { Key: Keys[0] } },
        { DeleteRequest: { Key: Keys[1] } },
      ] } }
    )
  })

  it('chunks documents to 25 per batchWrite', async () => {
    const client = mockClient()
    appendDeleteAll(client)

    let Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await client.deleteAll({ Keys })

    expect(client.mockReference).toHaveBeenCalledTimes(Math.ceil(Keys.length / 25))
  })
})
