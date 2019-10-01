
/**
 * @typedef { import('aws-sdk') } AWS
 */

const { EventEmitter } = require('events')
const allListeners = require('./utils/allListeners')
const recursor = require('./utils/recursor')

const queryRecursor = async (passalongs, chunkCallback) => {
  passalongs.method = 'query'
  passalongs.params = passalongs.queryParams
  delete passalongs.queryParams
  return recursor(passalongs, chunkCallback)
}

const queryEmitter = (client, queryParams, synchronous = false) => {
  const emitter = new EventEmitter()

  queryRecursor({ client, queryParams }, async (data) => {
    if (synchronous) {
      await allListeners(emitter, 'data', data)
      await allListeners(emitter, 'items', data.Items)
    } else {
      emitter.emit('data', data)
      emitter.emit('items', data.Items)
    }

    if (!data.LastEvaluatedKey) {
      emitter.emit('done')
    }
  }).catch((err) => {
    emitter.emit('error', err)
  })
  return emitter
}

exports.appendQueryExtensions = (client) => {
  /**
   * Query all pages into memory.
   *
   * @param {AWS.DynamoDB.DocumentClient.QueryInput} queryParams
   * @returns {Promise<Array>} Resolves with an array of Items
   */
  client.queryAll = async (queryParams = {}) => {
    return new Promise((resolve, reject) => {
      const items = []
      try {
        queryRecursor({ client, queryParams }, async (data) => {
          data.Items.forEach(item => items.push(item))
          if (!data.LastEvaluatedKey) resolve(items)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Returns an EventEmitter that you can subscribe on to be
   * notified of each batch of matching items from the table.
   * This is an especially useful feature when dealing with
   * enormous datasets that wont fit in memory but don't want
   * to implement your own pagination to deal with chunks.
   *
   * @param {AWS.DynamoDB.DocumentClient.QueryInput} queryParams
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.queryStream = (queryParams = {}) => {
    return queryEmitter(client, queryParams)
  }

  /**
   * Similar to stream, but waits for all eventlisteners to resolve before reading the next page.
   *
   * @param {AWS.DynamoDB.DocumentClient.QueryInput} queryParams
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.queryStreamSync = (queryParams = {}) => {
    return queryEmitter(client, queryParams, true)
  }
}
