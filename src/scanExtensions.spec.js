
const { EventEmitter } = require('events')

const mockClient = (method = 'scan') => {
  const methodMock = jest.fn(async () => ({ Items: [] }))
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const { appendScanExtensions } = require('./scanExtensions')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('scanExtensions', () => {
  it.each(['scanAll', 'scanStream', 'scanStreamSync'])('appends %s() to DocumentClient', (methodName) => {
    const client = mockClient()

    appendScanExtensions(client)

    expect(client).toHaveProperty(methodName)
    expect(client[methodName]).toBeInstanceOf(Function)
  })
})

describe('scanAll()', () => {
  it('returns a Promise', () => {
    const client = mockClient()
    appendScanExtensions(client)

    expect(client.scanAll()).toBeInstanceOf(Promise)
  })

  it('forwards parameters to scan()', async () => {
    const client = mockClient()
    appendScanExtensions(client)

    const lux = {
      location: 'Los Angeles',
      owner: 'Lucifer Morningstar',
    }
    await client.scanAll(lux)

    expect(client.mockReference).toHaveBeenCalledWith(lux)
  })

  it('resolves with the resultset items', async () => {
    const client = mockClient()
    appendScanExtensions(client)
    const result = { Items: [{ name: 'Amenadiel' }, { name: 'Linda' }] }
    client.mockReference.mockResolvedValueOnce(result)

    await expect(client.scanAll()).resolves.toEqual(result.Items)
  })

  it('performs multiple scans if necessary', async () => {
    const client = mockClient()
    appendScanExtensions(client)

    const firstRound = { Items: [{ name: 'Maze' }, { name: 'Trixie' }], LastEvaluatedKey: 'Chloe' }
    client.mockReference.mockResolvedValueOnce(firstRound)

    const secondRound = { Items: [{ name: 'Abel' }, { name: 'Cain' }] }
    client.mockReference.mockResolvedValueOnce(secondRound)

    const results = await client.scanAll()

    expect(client.mockReference).toHaveBeenCalledTimes(2)
    expect(client.mockReference.mock.calls[1][0]).toEqual({ ExclusiveStartKey: 'Chloe' })
    expect(results).toEqual(firstRound.Items.concat(secondRound.Items))
  })
})
describe.each(['scanStream', 'scanStreamSync'])('%s()', (streamMethod) => {
  it('returns an EventEmitter', () => {
    const client = mockClient()
    appendScanExtensions(client)

    expect(client[streamMethod]()).toBeInstanceOf(EventEmitter)
  })

  it('forwards parameters to scan()', async () => {
    const client = mockClient()
    appendScanExtensions(client)

    const params = {
      location: 'Stockholm',
      weather: 'Sunny',
    }
    await client[streamMethod](params)

    expect(client.mockReference).toHaveBeenCalledWith(params)
  })

  it('emits data', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    const result = { Items: [{ drink: 'Coffee' }, { drink: 'Red Bull' }], SomeProperty: 9000 }
    client.mockReference.mockResolvedValueOnce(result)

    const emitter = client[streamMethod]()

    emitter.on('data', (data) => {
      expect(data).toEqual(result)
      done()
    })
  })

  it('emits items', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    const result = { Items: [{ drink: 'Coffee' }, { drink: 'Red Bull' }] }
    client.mockReference.mockResolvedValueOnce(result)

    const emitter = client[streamMethod]()

    emitter.on('items', (data) => {
      expect(data).toEqual(result.Items)
      done()
    })
  })

  it('emits error', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    // Note: technically, a retryable error would still emit errors here
    // since we didn't apply retryableExceptions on our mock client.
    class NonRetryableError extends Error {}
    const errorInstance = new NonRetryableError()
    client.mockReference.mockRejectedValueOnce(errorInstance)

    const emitter = client[streamMethod]()

    emitter.on('error', (err) => {
      expect(err).toBe(errorInstance)
      done()
    })
  })

  it('emits done', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    const results = [
      { Items: [{ name: 'Britney' }], LastEvaluatedKey: 'Rhianna' },
      { Items: [{ name: 'Shakira' }] },
    ]
    client.mockReference
      .mockResolvedValueOnce(results[0])
      .mockResolvedValueOnce(results[1])

    const emitter = client[streamMethod]()

    const dataListener = jest.fn()
    emitter.on('data', dataListener)
    emitter.on('done', () => {
      expect(dataListener).toHaveBeenCalledTimes(2)
      expect(dataListener).toHaveBeenNthCalledWith(1, results[0])
      expect(dataListener).toHaveBeenNthCalledWith(2, results[1])
      done()
    })
  })

  it('launches multiple scans when parallelScans > 1', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    const parallelScans = 10
    client[streamMethod]({}, parallelScans)

    setTimeout(() => {
      expect(client.mockReference).toHaveBeenCalledTimes(parallelScans)
      done()
    }, 10)
  })

  it('only emits done when all segments have completed', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    const results = [
      { Items: [{ name: 'Beyonce' }] },
      { Items: [{ name: 'Britney' }], LastEvaluatedKey: 'Britney' },
      { Items: [{ name: 'Shakira' }] },
    ]
    client.mockReference
      .mockResolvedValueOnce(results[0])
      .mockResolvedValueOnce(results[1])
      .mockResolvedValueOnce(results[2])

    const emitter = client[streamMethod]({}, 2)

    const itemsListener = jest.fn()
    emitter.on('items', itemsListener)
    emitter.on('done', () => {
      expect(itemsListener).toHaveBeenCalledTimes(3)
      expect(itemsListener.mock.calls.map(args => args[0])).toEqual(results.map(res => res.Items))
      done()
    })
  })
})
describe('scanStream()', () => {
  it('doesnt wait for listeners before proceeding', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    // We'll use the same mock for both client and listener,
    // that way we can verify the order in which they get called
    const mockImplementations = [
      async () => ({ Items: [{ time: Date.now() }], LastEvaluatedKey: 'Fruits' }),
      async () => { return new Promise((resolve) => { setTimeout(() => resolve(Date.now()), 25) }) },
      async () => ({ Items: [{ time: Date.now() }] })
    ]
    mockImplementations.forEach((func) => client.mockReference.mockImplementationOnce(func))

    const params = {}
    const emitter = client.scanStream(params)

    const itemsListener = client.mockReference
    emitter.on('items', itemsListener)
    emitter.on('done', async () => {
      expect(client.mockReference).toHaveBeenCalledTimes(4)
      // Because its by reference, the same params object is sent to every scan() call
      expect(client.mockReference.mock.calls[0][0]).toBe(params)
      expect(client.mockReference.mock.calls[2][0]).toBe(params)

      // Lets verify the timings
      expect(itemsListener.mock.results[1].value).toBeInstanceOf(Promise)
      const callbackTimer = await itemsListener.mock.results[1].value

      expect(client.mockReference.mock.results[2].value).toBeInstanceOf(Promise)
      const secondScanResult = await client.mockReference.mock.results[2].value
      const { Items: [{ time: secondScanTimer }] } = secondScanResult

      expect(secondScanTimer).toBeLessThan(callbackTimer)
      done()
    })
  })
})
describe('scanStreamSync()', () => {
  it('waits for data and items listeners before proceeding', (done) => {
    expect.hasAssertions()
    const client = mockClient()
    appendScanExtensions(client)

    // We'll use the same mock for both client and listener,
    // that way we can verify the order in which they get called
    const mockImplementations = [
      async () => ({ Items: [{ name: 'Apple' }], LastEvaluatedKey: 'Fruits' }),
      async () => { return new Promise((resolve) => { setTimeout(resolve, 100) }) },
      async () => ({ Items: [{ name: 'Samsung' }] })
    ]
    mockImplementations.forEach((func) => client.mockReference.mockImplementationOnce(func))

    const params = {}
    const emitter = client.scanStreamSync(params)

    const itemsListener = client.mockReference
    emitter.on('items', itemsListener)
    emitter.on('done', () => {
      expect(itemsListener).toHaveBeenCalledTimes(4)
      // Because its by reference, the same params object is sent to every scan() call
      expect(itemsListener.mock.calls[0][0]).toBe(params)
      expect(itemsListener.mock.calls[1][0]).not.toBe(params)
      expect(itemsListener.mock.calls[2][0]).toBe(params)
      done()
    })
  })
})
