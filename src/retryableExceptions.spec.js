
jest.doMock('./utils/sleep', () => jest.fn(async (input) => input))
const sleep = require('./utils/sleep')

jest.doMock('./clientMethods', () => ['attack'])
const methods = require('./clientMethods')

const mockClient = (method = 'attack') => {
  const methodMock = jest.fn(async () => 1337)
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const {
  autoRetry,
  retryableExceptions,
} = require('./retryableExceptions')

beforeEach(() => {
  jest.clearAllMocks()
})

it('autoRetry is a function', () => {
  expect(autoRetry).toBeInstanceOf(Function)
})

it('autoRetry() mutates the client', async () => {
  expect.assertions(methods.length)
  methods.forEach((method) => {
    const client = mockClient(method)

    const preMutated = client[method].toString()
    autoRetry(client)
    const postMutated = client[method].toString()

    expect(postMutated).not.toBe(preMutated)
  })
})

it('calls the original method', async () => {
  const client = mockClient()
  autoRetry(client)

  const params = {
    hello: 'world',
  }
  await client[client.methodName](params).catch(() => {})

  expect(client.mockReference).toHaveBeenCalledWith(params)
})

it('lists temporary exceptions', () => {
  expect(retryableExceptions).toBeInstanceOf(Array)
})

it('unknown exceptions bubble', async () => {
  const client = mockClient()
  client.mockReference.mockRejectedValueOnce(new Error('Mega Exception!'))
  autoRetry(client)

  const clientCall = client[client.methodName]()
  await expect(clientCall).rejects.toThrow('Mega Exception!')
})

it('temporary exceptions are intercepted and retried', async () => {
  const client = mockClient()

  // An error with the name property
  const errWithName = new Error('Super Crazy Error Occurred')
  errWithName.name = 'ThrottlingException'

  // An error with a named constructor
  class ProvisionedThroughputExceededException extends Error {}
  const errWithConstructor = new ProvisionedThroughputExceededException()

  // And the final "db result"
  const expectedFinalResult = 'World Peace'

  client.mockReference
    .mockRejectedValueOnce(errWithName)
    .mockRejectedValueOnce(errWithConstructor)
    .mockResolvedValueOnce(expectedFinalResult)

  autoRetry(client)
  const clientCall = client[client.methodName]()
  await expect(clientCall).toResolve()

  expect(sleep).toHaveBeenCalledTimes(2)
  expect(client.mockReference).toHaveBeenCalledTimes(3)
  await expect(clientCall).resolves.toBe(expectedFinalResult)
})

it('backs off on consecutive temporaries', async () => {
  const client = mockClient()
  autoRetry(client)

  // Generate a bunch of errors
  const errors = retryableExceptions.map((errorName) => {
    const err = new Error(`An annoying ${errorName}`)
    err.name = errorName
    return err
  })
  errors.forEach(err => client.mockReference.mockRejectedValueOnce(err))
  client.mockReference.mockResolvedValueOnce('Yay.')

  // Call the client
  const clientCall = client[client.methodName]()
  await expect(clientCall).toResolve()

  // Verify our backoff worked by looking at mirrored return val from our mock
  expect(sleep).toHaveBeenCalledTimes(errors.length)
  const sleepValues = await Promise.all(sleep.mock.results.map(res => res.value))
  expect(sleepValues).toHaveLength(errors.length)
  sleepValues.forEach((val, i) => {
    if (!i) return
    expect(val).toBeGreaterThan(sleepValues[i - 1])
  })
})
