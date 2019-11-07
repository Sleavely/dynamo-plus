
const mockClient = (method = 'batchWrite') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const batchWriteRetry = require('./batchWriteRetry')

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
