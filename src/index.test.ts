import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { DynamoPlus } from '.'
import { BatchGetCommand, BatchWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const dynamoPlus = new DynamoPlus()
const client = dynamoPlus.client
const clientMock = mockClient(client)

beforeEach(() => {
  clientMock.reset()
  clientMock.on(BatchGetCommand).resolves({})
  clientMock.on(BatchWriteCommand).resolves({})
})

describe('batchGet()', () => {
  test.todo('does something', async () => {})
})

describe('batchWrite()', () => {
  test.todo('does something', async () => {})
})

describe('deleteAll()', () => {
  const TableName = 'vitest-table-deleteAll'

  it('returns a Promise', () => {
    expect(dynamoPlus.deleteAll({ TableName, Keys: [{}] })).toBeInstanceOf(Promise)
  })

  it('builds appropriate batchWrite params', async () => {
    const TableName = 'Woop woop!'
    const Keys = [{ a: 'b' }, { c: 'd' }]
    await dynamoPlus.deleteAll({ TableName, Keys })

    expect(clientMock).toHaveReceivedCommandWith(BatchWriteCommand,
      {
        RequestItems: {
          [TableName]: [
            { DeleteRequest: { Key: Keys[0] } },
            { DeleteRequest: { Key: Keys[1] } },
          ],
        },
      },
    )
  })

  it('chunks documents to 25 per batchWrite', async () => {
    const Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await dynamoPlus.deleteAll({ TableName, Keys })

    expect(clientMock).toHaveReceivedCommandTimes(BatchWriteCommand, Math.ceil(Keys.length / 25))
  })
})

describe('get()', () => {
  test('sends a GetItem command, returning the item', async () => {
    const expectedItem = {
      name: 'cheeseburger',
      ingredients: ['bread', 'meat', 'cheese'],
    }
    clientMock
      .on(GetCommand)
      .resolvesOnce({ Item: expectedItem })

    const res = await dynamoPlus.get({ TableName: 'mcdonalds', Key: { burgerId: 'cheeseburger' } })

    expect(clientMock).toHaveReceivedCommand(GetCommand)
    expect(clientMock).toHaveReceivedCommandWith(GetCommand, {
      TableName: 'mcdonalds',
      Key: { burgerId: 'cheeseburger' },
    })
    expect(res).toBe(expectedItem)
  })
})

describe('getAll()', () => {
  const TableName = 'vitest-table-getAll'

  it('builds appropriate batchGet params', async () => {
    const Keys = [{ id: 'b' }, { id: 'd' }]

    await dynamoPlus.getAll({ TableName, Keys })

    expect(clientMock).toHaveReceivedCommandWith(BatchGetCommand,
      { RequestItems: { [TableName]: { Keys } } },
    )
  })

  it('chunks documents to 100 per batchGet by default', async () => {
    const Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await dynamoPlus.getAll({ Keys, TableName })

    expect(clientMock).toHaveReceivedCommandTimes(BatchGetCommand, Math.ceil(Keys.length / 100))
  })

  it('allows batch size to be overridden', async () => {
    const BatchSize = 10

    const Keys = []
    for (let i = 0; i < 123; i++) {
      Keys.push({ documentNumber: `doc-${i}` })
    }
    await dynamoPlus.getAll({ BatchSize, Keys, TableName })

    expect(clientMock).toHaveReceivedCommandTimes(BatchGetCommand, Math.ceil(Keys.length / BatchSize))
  })

  it('resolves with a compiled list of documents', async () => {
    const BatchSize = 1

    const Keys = [{ foo: 1 }, { bar: 2 }]
    Keys
      .reduce((mock, key) => {
        return mock.resolvesOnce({ Responses: { [TableName]: [key] }, UnprocessedKeys: {} })
      }, clientMock.on(BatchGetCommand))

    const results = await dynamoPlus.getAll({ BatchSize, Keys, TableName })

    expect(results).toEqual(Keys)
  })
})

describe('put()', () => {
  test.todo('does something', async () => {})
})

describe('putAll()', () => {
  const TableName = 'vitest-table-putAll'

  it('returns a Promise', () => {
    expect(dynamoPlus.putAll({ TableName, Items: [{}] })).toBeInstanceOf(Promise)
  })

  it('builds appropriate batchWrite params', async () => {
    const Items = [{ a: 'b' }, { c: 'd' }]
    await dynamoPlus.putAll({ TableName, Items })

    expect(clientMock).toHaveReceivedCommandWith(BatchWriteCommand,
      {
        RequestItems: {
          [TableName]: [
            { PutRequest: { Item: Items[0] } },
            { PutRequest: { Item: Items[1] } },
          ],
        },
      },
    )
  })

  it('chunks documents to 25 per batchWrite', async () => {
    const Items = []
    for (let i = 0; i < 123; i++) {
      Items.push({ documentNumber: `doc-${i}` })
    }
    await dynamoPlus.putAll({ Items, TableName })

    expect(clientMock).toHaveReceivedCommandTimes(BatchWriteCommand, Math.ceil(Items.length / 25))
  })
})

describe('query()', () => {
  test.todo('does something', async () => {})
})

describe('queryAll()', () => {
  test.todo('does whatever dynamo-plus does', async () => {})
})

describe('queryIterator()', () => {
  test.todo('does something', async () => {})
})

describe('scan()', () => {
  test.todo('does something', async () => {})
})

describe('scanAll()', () => {
  test.todo('does something', async () => {})
})

describe('scanIterator()', () => {
  test.todo('does something', async () => {})
})

describe('transactGet()', () => {
  test.todo('does something', async () => {})
})

describe('transactWrite()', () => {
  test.todo('does something', async () => {})
})

describe('update()', () => {
  test.todo('does something', async () => {})
})
