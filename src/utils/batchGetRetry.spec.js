
const mockClient = (method = 'batchGet') => {
  const methodMock = jest.fn(async () => ({ UnprocessedItems: {} }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const batchGetRetry = require('./batchGetRetry')

describe('batchGetRetry()', () => {
  it('returns a Promise', async () => {
    const client = mockClient()

    expect(batchGetRetry(client)).toBeInstanceOf(Promise)
  })

  it('forwards params to the client', async () => {
    const client = mockClient()

    const TableName = 'Area51'
    const params = { RequestItems: { [TableName]: [] } }
    await batchGetRetry(client, params)

    expect(client.mockReference).toHaveBeenCalledWith(params)
  })

  it('retries unprocessed keys', async () => {
    const client = mockClient()

    const TableName = 'Area51'
    const Item = {
      id: 'foo',
      name: 'Matthew',
    }
    const RequestItems = { [TableName]: [{ PutRequest: { Item } }] }

    // Make sure it fails once.
    client.mockReference.mockResolvedValueOnce({ UnprocessedKeys: RequestItems })

    const params = { RequestItems }
    await batchGetRetry(client, params)

    expect(client.mockReference).toHaveBeenCalledTimes(2)
  })
})
