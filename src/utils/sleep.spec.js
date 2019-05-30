
const sleep = require('./sleep')

it('returns a promise', async () => {
  expect(sleep()).toBeInstanceOf(Promise)
})

it('resolves after a custom amount of time', async () => {
  // Time travel in tests is always hell. Jest provides facilities
  // for this but I couldn't for the life of me get it working, so..
  const startTime = Date.now()
  const expectedSleepTime = 50
  const margin = 150
  await expect(sleep(expectedSleepTime)).toResolve()
  expect(Date.now() - startTime).toBeLessThan(expectedSleepTime + margin)
})

it('can resolve with a custom value', async () => {
  const customValue = 'Rocinante'
  await expect(sleep(50, customValue)).resolves.toBe(customValue)
})
