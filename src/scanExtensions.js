
const { EventEmitter } = require('events')

/**
 * recursion
 * /rɪˈkəːʃ(ə)n/
 *
 * Did you mean: Recursion
 *
 * @see https://www.google.com/search?q=Recursion
 */
const scanRecursor = async (passalongs, chunkCallback) => {
  const { client, scanParams } = passalongs

  const data = await client.scan(scanParams)
  await chunkCallback(data)

  // continue scanning if we have more items
  if (data.LastEvaluatedKey) {
    scanParams.ExclusiveStartKey = data.LastEvaluatedKey
    scanRecursor(passalongs, chunkCallback)
  }
}

/**
 * Adds "all()" method for loading an entire table into an array.
 */
exports.appendAll = (client) => {
  /**
   * Scan a table into memory.
   *
   * @param {DynamoDB.Types.ScanInput}
   * @returns {Promise<Array>} Resolves with an array of Items
   */
  client.all = async (scanParams = {}) => {
    return new Promise((resolve, reject) => {
      const items = []
      try {
        scanRecursor(scanParams, async (data) => {
          data.Items.forEach(item => items.push(item))
          if (!data.LastEvaluatedKey) resolve(items)
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}

/**
 * Adds "stream()" and "streamSync()", recursive
 * alternatives to scan() that use EventEmitter.
 */
exports.appendStream = (client) => {
  /**
   * Returns an EventEmitter that you can subscribe on to be
   * notified of each batch of items from the table. This is
   * an especially useful feature when dealing with enormous
   * datasets that wont fit in memory but don't want to
   * implement your own pagination to deal with chunks.
   *
   * @param {DynamoDB.Types.ScanInput}
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.stream = (scanParams = {}) => {
    const emitter = new EventEmitter()
    try {
      scanRecursor({ client, scanParams }, async (data) => {
        emitter.emit('data', data)
        emitter.emit('items', data.Items)

        if (!data.LastEvaluatedKey) emitter.emit('done')
      })
    } catch (err) {
      emitter.emit('error', err)
    }
    return emitter
  }

  /**
   * Similar to stream, but waits for all eventlisteners to resolve before recursing the next batch.
   *
   * @param {DynamoDB.Types.ScanInput}
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.streamSync = (scanParams = {}) => {
    const emitter = new EventEmitter()
    try {
      scanRecursor({ client, scanParams }, async (data) => {
        await Promise.all(emitter.listeners('data').map((listener) => listener(data)))
        await Promise.all(emitter.listeners('items').map((listener) => listener(data.Items)))

        if (!data.LastEvaluatedKey) emitter.emit('done')
      })
    } catch (err) {
      emitter.emit('error', err)
    }
    return emitter
  }
}
