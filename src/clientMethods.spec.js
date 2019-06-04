
const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const methods = require('./clientMethods')

it('exposes a list of methods to mutate', () => {
  expect(methods).toBeInstanceOf(Array)
})

// Dont want to modify something that isn't actually a real method
it.each(methods)('%s() exists on DocumentClient', (method) => {
  expect(DocumentClient.prototype).toHaveProperty(method)
})
