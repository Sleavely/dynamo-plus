import {
  type BatchGetCommandInput,
  type BatchGetCommandOutput,
} from '@aws-sdk/lib-dynamodb'
import { type DynamoPlus } from '..'

export const batchReadRetry = async (dynamo: DynamoPlus, getParams: BatchGetCommandInput): Promise<Required<BatchGetCommandOutput>['Responses']> => {
  const { Responses = {}, UnprocessedKeys = {} } = await dynamo.batchGet(getParams)

  if (Object.keys(UnprocessedKeys).length) {
    // Retry and merge the output
    const retriedResponses = await batchReadRetry(dynamo, { ...getParams, RequestItems: UnprocessedKeys })

    Object.keys(retriedResponses).forEach((tableName) => {
      if (!Responses[tableName]) Responses[tableName] = []
      Responses[tableName].push(...retriedResponses[tableName])
    })
  }
  return Responses
}
