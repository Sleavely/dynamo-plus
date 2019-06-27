
const recursor = require('./utils/recursor')

const queryRecursor = async (passalongs, chunkCallback) => {
  passalongs.method = 'query'
  return recursor(passalongs, chunkCallback)
}

exports.appendQueryExtensions = (client) => {
  /**
   * Query all pages into memory.
   *
   * @param {DynamoDB.Types.QueryInput}
   * @returns {Promise<Array>} Resolves with an array of Items
   */
  client.queryAll = async (scanParams = {}) => {
    return new Promise((resolve, reject) => {
      const items = []
      try {
        queryRecursor({ client, scanParams }, async (data) => {
          data.Items.forEach(item => items.push(item))
          if (!data.LastEvaluatedKey) resolve(items)
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}
