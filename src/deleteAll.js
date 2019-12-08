
const batchWriteRetry = require('./utils/batchWriteRetry')
const chunk = require('./utils/chunk')

exports.appendDeleteAll = (client) => {
  client.deleteAll = async (params = {}) => {
    const {
      TableName = '',
      Keys = [],
      BatchSize = 25,
    } = params

    const batches = chunk(Keys, BatchSize)

    // Build a chain of batchWrite operations
    return batches.reduce(async (chain, batch) => {
      await chain

      return batchWriteRetry(client, {
        RequestItems: {
          [TableName]: batch.map((key) => ({ DeleteRequest: { Key: key } })),
        },
      })
    }, Promise.resolve())
  }
}
