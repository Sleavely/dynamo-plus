
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

    expect(batchWriteRetry(client, { TableName: 'Area51', Items: [] })).toBeInstanceOf(Promise)
  })

  it('forwards params to the client', async () => {
    const client = mockClient()
    client.mockReference.mockResolvedValueOnce({ UnprocessedItems: { TableNameHere: {} } })
    const params = { TableName: 'Area51', Items: [] }
    batchWriteRetry(client, params)

    expect(client.mockReference).toHaveBeenCalledWith(params)
    expect(client.mockReference).toHaveBeenCalledTimes(2)
  })

  it('retries unprocessed items', async () => {
    const client = mockClient()
    const params = { TableName: 'Area51', Items: [] }
    batchWriteRetry(client, params)
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
