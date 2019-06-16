
jest.doMock('./utils/allListeners', () => jest.fn(async (...input) => [...input]))

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
describe.each(['scanStream', 'scanStreamSync'])('%s()', () => {
  it.todo('returns an EventEmitter')
  it.todo('forwards parameters to scan()')
  it.todo('emits data')
  it.todo('emits items')
  it.todo('emits error')
  it.todo('emits done')
  it.todo('launches multiple scans when parallelScans > 1')
  it.todo('only emits done when all segments have completed')
})
describe('scanStreamSync()', () => {
  it.todo('waits for data and items listeners before proceeding')
})
