import { type BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb'
import { type DynamoPlus } from '..'

export const batchWriteRetry = async (dynamo: DynamoPlus, writeParams: BatchWriteCommandInput): Promise<void> => {
  const { UnprocessedItems = {} } = await dynamo.batchWrite(writeParams)

  if (Object.keys(UnprocessedItems).length) {
    await batchWriteRetry(dynamo, { RequestItems: UnprocessedItems })
  }
}
