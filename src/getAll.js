const batchReadRetry = require('./utils/batchGetRetry')
const chunk = require('./utils/chunk')

exports.appendGetAll = (client) => {
  client.getAll = async (params = {}) => {
    const {
      TableName = '',
      Keys = [],
      BatchSize = 100,
    } = params

    const batches = chunk(Keys, BatchSize)

    // Build a chain of batchWrite operations
    return batches.reduce(async (chain, batch) => {
      const previousResults = await chain

      const output = await batchReadRetry(client, {
        RequestItems: {
          [TableName]: {
            Keys: batch,
          },
        },
      })
      return previousResults.concat(...output[TableName])
    }, [])
  }
}
