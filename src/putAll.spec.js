
const mockClient = (method = 'batchWrite') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

var todo = async () => { throw new Error('Welp. Hope you arent trying to merge this.') }

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
      name: 'Matthew'
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

  it('forwards parameters to batchWrite()', todo)

  it('resolves with the resultset items', todo)

  it('performs multiple batchWrites if necessary', todo)
})
