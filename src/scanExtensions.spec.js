
jest.doMock('./utils/allListeners', () => jest.fn(async (...input) => [...input]))
const allListeners = require('./utils/allListeners')

const mockClient = (method = 'scan') => {
  const methodMock = jest.fn(async () => {1337})
  return {
    mockReference: methodMock,
    methodName: method,
    [method]: methodMock,
  }
}

const appendScanExtensions = require('./scanExtensions')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('scanExtensions', () => {
  it.todo('appends scanAll() to DocumentClient')
  it.todo('appends scanStream() to DocumentClient')
  it.todo('appends scanStreamSync() to DocumentClient')
})

describe('scanAll()', () => {
  it.todo('returns a Promise')
  it.todo('forwards parameters to scan()')
  it.todo('resolves with the resultset')
  it.todo('performs multiple scans if necessary')
})
describe.each(['scanStream', 'scanStreamSync'])
('%s()', () => {
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
