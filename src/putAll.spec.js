
const mockClient = (method = 'batchWrite') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const { appendPutAll } = require('./putAll')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('appendPutAll()', () => {
  it('appends putAll() to DocumentClient', () => {
    const client = mockClient()

    appendPutAll(client)

    expect(client).toHaveProperty('putAll')
    expect(client.putAll).toBeInstanceOf(Function)
  })
})

describe('putAll()', () => {
  it('returns a Promise', () => {
    const client = mockClient()
    appendPutAll(client)

    expect(client.putAll()).toBeInstanceOf(Promise)
  })

  it('builds appropriate batchWrite params', async () => {
    const client = mockClient()
    appendPutAll(client)

    const TableName = 'Woop woop!'
    const Items = [{ a: 'b' }, { c: 'd' }]
    await client.putAll({ TableName, Items })

    expect(client.mockReference.mock.calls[0][0]).toStrictEqual(
      { RequestItems: { [TableName]: [
        { PutRequest: { Item: Items[0] } },
        { PutRequest: { Item: Items[1] } },
      ] } }
    )
  })

  it('chunks documents to 25 per batchWrite', async () => {
    const client = mockClient()
    appendPutAll(client)

    let Items = []
    for (let i = 0; i < 123; i++) {
      Items.push({ documentNumber: `doc-${i}` })
    }
    await client.putAll({ Items })

    expect(client.mockReference).toHaveBeenCalledTimes(Math.ceil(Items.length / 25))
  })
})
