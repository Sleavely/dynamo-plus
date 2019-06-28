
/**
 * @typedef { import('aws-sdk') } AWS
 */

const { EventEmitter } = require('events')
const allListeners = require('./utils/allListeners')
const recursor = require('./utils/recursor')

const scanRecursor = async (passalongs, chunkCallback) => {
  passalongs.method = 'scan'
  passalongs.params = passalongs.scanParams
  delete passalongs.scanParams
  return recursor(passalongs, chunkCallback)
}

const scanEmitter = (client, scanParams, parallelScans, synchronous = false) => {
  const emitter = new EventEmitter()
  let completedParallelScans = 0
  for (let i = 0; i < parallelScans; i++) {
    // We only want to touch the request if explicitly told to,
    // they could be setting their own values for parallelism.
    if (parallelScans > 1) {
      scanParams = { ...scanParams }
      scanParams.Segment = i
      scanParams.TotalSegments = parallelScans
    }

    scanRecursor({ client, scanParams }, async (data) => {
      if (synchronous) {
        await allListeners(emitter, 'data', data)
        await allListeners(emitter, 'items', data.Items)
      } else {
        emitter.emit('data', data)
        emitter.emit('items', data.Items)
      }

      if (!data.LastEvaluatedKey) {
        completedParallelScans++
        if (completedParallelScans === parallelScans) emitter.emit('done')
      }
    }).catch((err) => {
      emitter.emit('error', err)
    })
  }
  return emitter
}

exports.appendScanExtensions = (client) => {
  /**
   * Scan a table into memory.
   *
   * @param {AWS.DynamoDB.DocumentClient.ScanInput} scanParams
   * @returns {Promise<Array>} Resolves with an array of Items
   */
  client.scanAll = async (scanParams = {}) => {
    return new Promise((resolve, reject) => {
      const items = []
      try {
        scanRecursor({ client, scanParams }, async (data) => {
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
   * notified of each batch of items from the table. This is
   * an especially useful feature when dealing with enormous
   * datasets that wont fit in memory but don't want to
   * implement your own pagination to deal with chunks.
   *
   * @param {AWS.DynamoDB.DocumentClient.ScanInput} scanParams
   * @param {Number} parallelScans
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.scanStream = (scanParams = {}, parallelScans = 1) => {
    return scanEmitter(client, scanParams, parallelScans)
  }

  /**
   * Similar to stream, but waits for all eventlisteners to resolve before recursing the next batch.
   * If parallel scanning is in effect, the synchronisity will only apply on a per-segment basis.
   *
   * @param {AWS.DynamoDB.DocumentClient.ScanInput} scanParams
   * @param {Number} parallelScans
   * @returns {EventEmitter} emits "data", "items", "done" and "error" events
   */
  client.scanStreamSync = (scanParams = {}, parallelScans = 1) => {
    return scanEmitter(client, scanParams, parallelScans, true)
  }
}
