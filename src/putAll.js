
const chunk = require('./utils/chunk')

/**
 * @typedef { import('aws-sdk') } AWS
 */

/** @typedef {{ TableName: string, Items: AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap[], BatchSize: Number }} PutAllRequest */

/**
 * Proxy for automatically retrying unprocessed batchWrite items.
 *
 * @param {AWS.DynamoDB.DocumentClient} client
 * @param {AWS.DynamoDB.DocumentClient.BatchWriteItemInput} writeParams
 * @return {Promise<undefined>}
 */
exports.batchWriteRetry = async (client, writeParams) => {
  const { UnprocessedItems = {} } = await client.batchWrite(writeParams)

  if (Object.keys(UnprocessedItems).length) {
    return exports.batchWriteRetry(client, { RequestItems: UnprocessedItems })
  }
}

exports.appendPutAll = (client) => {
  /**
   * Similar to put(), but takes an Items property with multiple documents to be written.
   *
   * @param {PutAllRequest} params
   * @returns {Promise<Array>} Resolves with an array of Items
   */
  client.putAll = async (params = {}) => {
    const {
      TableName = '',
      Items = [],
      BatchSize = 25,
    } = params

    // batchWrite() only supports up to 25 items at once.
    // Note: If you're dealing with VERY large documents,
    // you may need to lower the size of the batches
    // since batchWrite only supports up to 16MB at a time.
    const batches = chunk(Items, BatchSize)

    // Build a chain of batchWrite operations
    return batches.reduce(async (chain, batch) => {
      await chain

      return exports.batchWriteRetry(client, {
        RequestItems: {
          [TableName]: batch.map((item) => ({ PutRequest: { Item: item } }))
        }
      })
    }, Promise.resolve())
  }
}
