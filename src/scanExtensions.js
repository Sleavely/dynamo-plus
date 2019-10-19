
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

  client.scanStream = (scanParams = {}, parallelScans = 1) => {
    return scanEmitter(client, scanParams, parallelScans)
  }

  client.scanStreamSync = (scanParams = {}, parallelScans = 1) => {
    return scanEmitter(client, scanParams, parallelScans, true)
  }
}
