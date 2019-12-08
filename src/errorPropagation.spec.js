
jest.doMock('aws-sdk/clients/dynamodb', () => ({
  DocumentClient: function () {
    return mockClient()
  }
}))

const { DynamoPlus } = require('./index')
const clientMethods = jest.requireActual('./clientMethods')

const mockClient = () => {
  const methodMock = jest.fn(async () => ({ Item: {} }))
  const client = {
    originalMethodMock: methodMock,
  }
  clientMethods.forEach(method => {
    client[method] = (params) => ({ promise: async () => methodMock(params) })
  })
  return client
}

beforeEach(() => {
  jest.clearAllMocks()
})

it.each(['deleteAll', 'putAll', 'scanAll', 'queryAll'])('%s() errors are catchable', async (method) => {
  const client = DynamoPlus()
  const expectedError = new Error(`Something scary occurred while calling ${method}`)
  const expectedFallbackObject = { method, caughtError: 'true' }

  // Make sure all the core Dynamo methods reject
  client.originalMethodMock.mockRejectedValue(expectedError)

  // 'Items' for putAll and 'Keys' for deleteAll
  const methodCallPromise = client[method]({ Items: [1337], Keys: ['bbq'] })
  await expect(methodCallPromise).toReject()

  // Make sure we get the _expected_ error from our "original" Dynamo method
  await expect(methodCallPromise).rejects.toBe(expectedError)

  // Verify its a catchable rejection and doesnt end up unhandled somewhere in limbo
  const result = await methodCallPromise.catch(() => expectedFallbackObject)
  expect(result).toBe(expectedFallbackObject)
})
