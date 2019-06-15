
const { EventEmitter } = require('events')

const allListeners = require('./allListeners')

it('returns a promise', async () => {
  const emitter = new EventEmitter()
  expect(allListeners(emitter)).toBeInstanceOf(Promise)
})

it('calls each listener bound to an EventEmitter', async () => {
  const emitter = new EventEmitter()
  const listeners = [
    jest.fn(),
    jest.fn(),
  ]
  listeners.forEach((listener) => emitter.on('phone', listener))

  await expect(allListeners(emitter, 'phone')).toResolve()
  listeners.forEach((listener) => {
    expect(listener).toHaveBeenCalled()
  })
})

it('returns the values from each listener', async () => {
  const emitter = new EventEmitter()
  const listeners = [
    (name) => `Hello ${name}`,
    () => 123,
  ]
  listeners.forEach((listener) => emitter.on('visitor', listener))

  await expect(allListeners(emitter, 'visitor', 'John Doe'))
    .resolves.toEqual(['Hello John Doe', 123])
})
