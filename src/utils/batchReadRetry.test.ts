import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { batchReadRetry } from './batchReadRetry'
import { DynamoPlus } from '..'
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'

const dynamoPlus = new DynamoPlus()
const client = dynamoPlus.client
const clientMock = mockClient(client)

beforeEach(() => {
  clientMock.reset()
  clientMock.resolves({})
})

describe('batchReadRetry()', () => {
  it('forwards params to the client', async () => {
    const TableName = 'Area51'
    const params = { RequestItems: { [TableName]: { Keys: [{ id: '123' }] } } }
    await batchReadRetry(dynamoPlus, params)

    expect(clientMock).toHaveReceivedCommandWith(BatchGetCommand, params)
  })

  it('returns responses', async () => {
    const TableName = 'Area51'
    const params = { RequestItems: { [TableName]: { Keys: [{ id: 'potato' }] } } }
    const Responses = { [TableName]: [{ id: 'potato' }] }
    clientMock.resolvesOnce({ Responses })
    const responses = await batchReadRetry(dynamoPlus, params)

    expect(responses).toBe(Responses)
  })

  it('retries unprocessed keys', async () => {
    const TableName = 'Area51'
    const Item1 = {
      id: 'foo',
      name: 'Matthew',
    }
    const Item2 = {
      id: 'bar',
      name: 'McConnaheyyy',
    }
    const RequestItems = { [TableName]: { Keys: [{ id: Item1.id }, { id: Item2.id }] } }

    // Make sure it fails once.
    clientMock.on(BatchGetCommand)
      .resolvesOnce({
        Responses: { [TableName]: [Item1] },
        UnprocessedKeys: { [TableName]: { Keys: [{ id: Item2.id }] } },
      })
      .resolvesOnce({
        Responses: { [TableName]: [Item2] },
      })

    const params = { RequestItems }
    const result = await batchReadRetry(dynamoPlus, params)

    expect(clientMock).toHaveReceivedCommandTimes(BatchGetCommand, 2)
    expect(result).toMatchObject({ [TableName]: [Item1, Item2] })
  })
})
