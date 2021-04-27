
const sleep = require('./sleep')

jest.useFakeTimers()

// Avoid leakage
beforeEach(() => {
  jest.runAllTimers()
})
afterEach(() => {
  jest.runAllTimers()
})

it('returns a promise', async () => {
  expect(sleep()).toBeInstanceOf(Promise)
})

it('resolves after a custom amount of time', async () => {
  const expectedSleepTime = 50

  const sleeperPromise = sleep(expectedSleepTime)
  jest.runAllTimers()

  await expect(sleeperPromise).toResolve()
  expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), expectedSleepTime)
})

it('can resolve with a custom value', async () => {
  const customValue = 'Rocinante'

  const sleeperPromise = sleep(50, customValue)
  jest.runAllTimers()

  await expect(sleeperPromise).resolves.toBe(customValue)
})
