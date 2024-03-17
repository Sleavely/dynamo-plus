import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { DynamoPlus } from '.'
import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  TransactGetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const dynamoPlus = new DynamoPlus()
const client = dynamoPlus.client
const clientMock = mockClient(client)

beforeEach(() => {
  clientMock.reset()
  clientMock.resolves({})
})

describe('batchGet()', () => {
  it('passes params to the DocumentClient equivalent', async () => {
    const params = { RequestItems: { 'vitest-table-batchGet': { Keys: [{ id: '123' }, { id: '456' }] } } }
    await dynamoPlus.batchGet(params)

    expect(clientMock).toHaveReceivedCommandWith(BatchGetCommand, params)
  })
})

describe('batchWrite()', () => {
  const TableName = 'vitest-table-batchWrite'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      RequestItems: {
        [TableName]: [
          { DeleteRequest: { Key: { userid: 'potato' } } },
          { PutRequest: { Item: { userid: 'fries' } } },
        ],
      },
    }
    await dynamoPlus.batchWrite(params)

    expect(clientMock).toHaveReceivedCommandWith(BatchWriteCommand, params)
  })
})

describe('delete()', () => {
  const TableName = 'vitest-table-delete'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TableName,
      Key: { id: 'potato' },
    }
    await dynamoPlus.delete(params)

    expect(clientMock).toHaveReceivedCommandWith(DeleteCommand, params)
  })
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
  it('sends a GetItem command, returning the item', async () => {
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
  const TableName = 'vitest-table-put'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = { TableName, Item: { potatoId: '45-C' } }
    await dynamoPlus.put(params)

    expect(clientMock).toHaveReceivedCommandWith(PutCommand, params)
  })
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
  const TableName = 'vitest-table-query'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TableName,
      IndexName: 'profileId-index',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'profileId' },
      ExpressionAttributeValues: { ':id': '12345-678-90a-bcdef' },
    }
    await dynamoPlus.query(params)

    expect(clientMock).toHaveReceivedCommandWith(QueryCommand, params)
  })
})

describe('queryAll()', () => {
  const TableName = 'vitest-table-queryAll'

  it('passes params to the DocumentClient equivalent', async () => {
    clientMock.on(QueryCommand)
      .resolvesOnce({ Items: [{ id: 'hello' }] })

    const params = {
      TableName,
      IndexName: 'profileId-index',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'profileId' },
      ExpressionAttributeValues: { ':id': '12345-678-90a-bcdef' },
    }
    const result = await dynamoPlus.queryAll(params)

    expect(clientMock).toHaveReceivedCommandWith(QueryCommand, params)
    expect(result).toMatchObject([{ id: 'hello' }])
  })

  it('automatically iterates multi-page responses', async () => {
    clientMock.on(QueryCommand)
      .resolvesOnce({ Items: [{ id: '1' }], LastEvaluatedKey: { id: 'potato' } })
      .resolvesOnce({ Items: [{ id: '2' }] })

    const params = {
      TableName,
      IndexName: 'profileId-index',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: { '#id': 'profileId' },
      ExpressionAttributeValues: { ':id': '12345-678-90a-bcdef' },
    }
    const result = await dynamoPlus.queryAll(params)

    expect(clientMock).toHaveReceivedCommandTimes(QueryCommand, 2)
    expect(result).toMatchObject([{ id: '1' }, { id: '2' }])
  })
})

describe('queryIterator()', () => {
  test.todo('does something', async () => {})
})

describe('scan()', () => {
  const TableName = 'vitest-table-scan'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TableName,
    }
    await dynamoPlus.scan(params)

    expect(clientMock).toHaveReceivedCommandWith(ScanCommand, params)
  })
})

describe('scanAll()', () => {
  const TableName = 'vitest-table-scanAll'

  it('passes params to the DocumentClient equivalent', async () => {
    clientMock.on(ScanCommand)
      .resolvesOnce({ Items: [{ id: 'hello' }] })

    const params = {
      TableName,
    }
    const result = await dynamoPlus.scanAll(params)

    expect(clientMock).toHaveReceivedCommandWith(ScanCommand, params)
    expect(result).toMatchObject([{ id: 'hello' }])
  })

  it('automatically iterates multi-page responses', async () => {
    clientMock.on(ScanCommand)
      .resolvesOnce({ Items: [{ id: '1' }], LastEvaluatedKey: { id: 'potato' } })
      .resolvesOnce({ Items: [{ id: '2' }] })

    const params = {
      TableName,
    }
    const result = await dynamoPlus.scanAll(params)

    expect(clientMock).toHaveReceivedCommandTimes(ScanCommand, 2)
    expect(result).toMatchObject([{ id: '1' }, { id: '2' }])
  })
})

describe('scanIterator()', () => {
  test.todo('does something', async () => {})
})

describe('transactGet()', () => {
  const TableName = 'vitest-table-transactGet'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TransactItems: [
        {
          Get: {
            TableName,
            Key: { id: '123' },
          },
        },
        {
          Get: {
            TableName,
            Key: { id: 'abc' },
          },
        },
      ],
    }
    await dynamoPlus.transactGet(params)

    expect(clientMock).toHaveReceivedCommandWith(TransactGetCommand, params)
  })
})

describe('transactWrite()', () => {
  const TableName = 'vitest-table-transactWrite'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TransactItems: [
        {
          Put: {
            TableName,
            Item: {
              id: 'R-8',
              name: 'Mouse',
            },
          },
        },
        {
          Update: {
            TableName,
            Key: { id: 'abc' },
            UpdateExpression: 'set #a = :x + :y',
            ConditionExpression: '#a < :MAX',
            ExpressionAttributeNames: { '#a': 'Sum' },
            ExpressionAttributeValues: {
              ':x': 20,
              ':y': 45,
              ':MAX': 100,
            },
          },
        },
      ],
    }
    await dynamoPlus.transactWrite(params)

    expect(clientMock).toHaveReceivedCommandWith(TransactWriteCommand, params)
  })
})

describe('update()', () => {
  const TableName = 'vitest-table-update'

  it('passes params to the DocumentClient equivalent', async () => {
    const params = {
      TableName,
      Key: { HashKey: 'hashkey' },
      UpdateExpression: 'set #a = :x + :y',
      ConditionExpression: '#a < :MAX',
      ExpressionAttributeNames: { '#a': 'Sum' },
      ExpressionAttributeValues: {
        ':x': 20,
        ':y': 45,
        ':MAX': 100,
      },
    }
    await dynamoPlus.update(params)

    expect(clientMock).toHaveReceivedCommandWith(UpdateCommand, params)
  })
})
