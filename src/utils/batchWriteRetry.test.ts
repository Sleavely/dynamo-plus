import { describe, it, expect, beforeEach } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { batchWriteRetry } from './batchWriteRetry'
import { DynamoPlus } from '..'
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

const dynamoPlus = new DynamoPlus()
const client = dynamoPlus.client
const clientMock = mockClient(client)

beforeEach(() => {
  clientMock.reset()
  clientMock.resolves({})
})

describe('batchWriteRetry()', () => {
  it('returns a Promise', async () => {
    expect(batchWriteRetry(dynamoPlus, { RequestItems: {} })).toBeInstanceOf(Promise)
  })

  it('forwards params to the dynamoPlus', async () => {
    const TableName = 'Area51'
    const params = { RequestItems: { [TableName]: [] } }
    await batchWriteRetry(dynamoPlus, params)

    expect(clientMock).toHaveReceivedCommandWith(BatchWriteCommand, params)
  })

  it('retries unprocessed items', async () => {
    const TableName = 'Area51'
    const Item = {
      id: 'foo',
      name: 'Matthew',
    }
    const RequestItems = { [TableName]: [{ PutRequest: { Item } }] }

    // Make sure it fails once.
    clientMock.on(BatchWriteCommand)
      .resolvesOnce({ UnprocessedItems: RequestItems })
      .resolvesOnce({})

    const params = { RequestItems }
    await batchWriteRetry(dynamoPlus, params)

    expect(clientMock).toHaveReceivedCommandTimes(BatchWriteCommand, 2)
  })
})
