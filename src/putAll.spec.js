
const mockClient = (method = 'batchWrite') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const { appendPutAll, batchWriteRetry } = require('./putAll')

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

describe('batchWriteRetry()', () => {
  it('returns a Promise', async () => {
    const client = mockClient()

    expect(batchWriteRetry(client)).toBeInstanceOf(Promise)
  })

  it('forwards params to the client', async () => {
    const client = mockClient()

    const TableName = 'Area51'
    const params = { RequestItems: { [TableName]: [] } }
    await batchWriteRetry(client, params)

    expect(client.mockReference).toHaveBeenCalledWith(params)
  })

  it('retries unprocessed items', async () => {
    const client = mockClient()

    const TableName = 'Area51'
    const Item = {
      id: 'foo',
      name: 'Matthew',
    }
    const RequestItems = { [TableName]: [{ PutRequest: { Item } }] }

    // Make sure it fails once.
    client.mockReference.mockResolvedValueOnce({ UnprocessedItems: RequestItems })

    const params = { RequestItems }
    await batchWriteRetry(client, params)

    expect(client.mockReference).toHaveBeenCalledTimes(2)
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
