# Dynamo Plus

[ ![npm version](https://img.shields.io/npm/v/dynamo-plus.svg?style=flat) ](https://npmjs.org/package/dynamo-plus "View this project on npm") [ ![CircleCI](https://img.shields.io/circleci/build/github/Sleavely/dynamo-plus?token=17812f5feb6c6923284f9df096227fa6f9256009) ](https://circleci.com/gh/Sleavely/dynamo-plus) [ ![Issues](https://img.shields.io/github/issues/Sleavely/dynamo-plus.svg) ](https://github.com/Sleavely/dynamo-plus/issues)

> Extend and supercharge your DynamoDB DocumentClient with promises, retries, and more.

[API Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) (minus the callbacks, of course)

# Installation

```shell
npm i dynamo-plus
```

```js
const { DynamoPlus } = require('dynamo-plus')
const documentClient = DynamoPlus({
  region: 'eu-west-1',
})

const regularDynamoParams = {
  TableName: 'myTable',
  Key: {
    myKey: '1337'
  }
}
const data = await documentClient.get(regularDynamoParams)
```

# Features

- automatically appends .promise()
- automatically retries and backs off when you get throttled
- new methods for performing batchWrite requests in chunks
  - [deleteAll(params)](#methods-deleteall)
  - [putAll(params)](#methods-putall)
- new methods for query operations
  - [queryAll(params)](#methods-queryall)
  - [queryStream(params)](#methods-querystream)
  - [queryStreamSync(params)](#methods-querystreamsync)
- new methods for scan operations
  - [scanAll(params)](#methods-scanall)
  - [scanStream(params)](#methods-scanstream)
  - [scanStreamSync(params)](#methods-scanstreamsync)

## Promises by default

The DynamoPlus client will automatically append `.promise()` for you, making all methods awaitable by default.

When the client is instantiated, the original methods are prefixed and accessible through e.g. ``original_${method}``

## Retries and backoff

Whenever a query fails for reasons such as `LimitExceededException` the promise will reboot behind the scenes so that you don't have to worry about it.

For information about retryable exceptions, see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes

If you want to use a delay from the beginning, set `lastBackOff` to a millisecond value in the query params.

## New methods for performing batchWrite requests in chunks

batchWrite is neat for inserting multiple documents at once, but it requires you to handle chunking and unprocessed items yourself, while also using it's own somewhat unique syntax. We've added deleteAll() and putAll() to do the heavy lifting for you.

<a name="methods-deleteall"></a>
### deleteAll(params)

_batchWrite_ deletions, but with the simple syntax of _delete_.

- **params** `Object`
  - **TableName**
  - **Keys** - An array of key objects equivalent to `Key` in _delete()_.
  - **BatchSize** - Optional custom batch size. Defaults to 25 which the maximum permitted value by DynamoDB.

_deleteAll()_ does not return any data once it resolves.

```js
const params = {
  TableName: 'Woop woop!',
  Keys: [{ userId: '123' }, { userId: 'abc' }]
}
await documentClient.deleteAll(params)
```

---

<a name="methods-putall"></a>
### putAll(params)

_batchWrite_ upserts, but with the simple syntax of _put_.

- **params** `Object`
  - **TableName**
  - **Items** - An array of documents equivalent to `Item` in _put()_.
  - **BatchSize** - Optional custom batch size. Defaults to 25 which the maximum permitted value by DynamoDB.

_putAll()_ does not return any data once it resolves.

```js
const params = {
  TableName: 'Woop woop!',
  Items: [{ a: 'b' }, { c: 'd' }]
}
await documentClient.putAll(params)
```

---

## New methods for query()

Query has new sibling methods that automatically paginate through resultsets for you.

<a name="methods-queryall"></a>
### queryAll(params)

Resolves with the entire array of matching items.

- **params** - [AWS.DynamoDB.DocumentClient.query() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property)


```js
const params = {
  TableName : 'items',
  IndexName: 'articleNo-index',
  KeyConditionExpression: 'articleNo = :val',
  ExpressionAttributeValues: { ':val': articleNo }
}
const response = await documentClient.queryAll(params)
// response now contains ALL items with the articleNo, not just the first 1MB
```

---

<a name="methods-querystream"></a>
### queryStream(params)

- **params** - [AWS.DynamoDB.DocumentClient.query() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property)

Like [scanStream](#methods-scanstream), but for queries.

---

<a name="methods-querystreamsync"></a>
### queryStreamSync(params)

- **params** - [AWS.DynamoDB.DocumentClient.query() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property)

Like [scanStreamSync](#methods-scanstreamsync), but for queries.

---

## New methods for scan()

We've supercharged _scan()_ for those times when you want to recurse through entire tables.

<a name="methods-scanall"></a>
### scanAll(params)

Resolves with the entire array of matching items.

- **params** - [AWS.DynamoDB.DocumentClient.scan() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property)

```js
const params = {
  TableName : 'MyTable',
  FilterExpression : 'Year = :this_year',
  ExpressionAttributeValues : {':this_year' : 2015}
}
const response = await documentClient.scanAll(params)
// response now contains ALL documents from 2015, not just the first 1MB
```

---

<a name="methods-scanstream"></a>
### scanStream(params[, parallelScans])

An EventEmitter-driven approach to recursing your tables. This is a powerful tool when you have datasets that are too large to keep in memory all at once.

To spread out the workload across your table partitions you can define a number of `parallelScans`. DynamoPlus will automatically keep track of the queries and emit a single `done` event once they all complete.

**Note:** scanStream() does not care whether your event listeners finish before it requests the next batch. (It will, however, respect throttling exceptions from DynamoDB.) If you want to control the pace, see [scanStreamSync](#methods-streamsync).

- **params** - [AWS.DynamoDB.DocumentClient.scan() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property)
- **parallelScans** - _integer|array_ (_Default: 1_) Amount of segments to split the scan operation into. It also accepts an array of individual segment options such as LastEvaluatedKey, the length of the array then decides the amount of segments.

The returned EventEmitter emits the following events:

- `data` - Raw response from each scan
- `items` - An array with documents
- `done` - Emitted once there are no more documents scan
- `error`

```js
const params = {
  TableName : 'MyTable'
}
const emitter = documentClient.scanStream(params)
emitter.on('items', async (items) => {
  console.log(items)
})
```

---

<a name="methods-scanstreamsync"></a>
### scanStreamSync(params[, parallelScans])

Like `scanStream()`, but will not proceed to request the next batch until all eventlisteners have returned a value (or resolved, if they return a Promise).

- **params** - [AWS.DynamoDB.DocumentClient.scan() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property)
- **parallelScans** - _integer|array_ (_Default: 1_) Amount of segments to split the scan operation into. It also accepts an array of individual segment options such as LastEvaluatedKey, the length of the array then decides the amount of segments.

The returned EventEmitter emits the following events:

- `data` - Raw response from each scan
- `items` - An array with documents
- `done` - Emitted once there are no more documents scan
- `error`

```js
const params = {
  TableName : 'MyTable'
}
const emitter = documentClient.scanStreamSync(params)
emitter.on('items', async (items) => {
  // Do something async with the documents
  return Promise.all(items.map((item) => sendItemToSantaClaus(item)))
  // Once the Promise.all resolves, scanStreamSync() will automatically request the next batch.
})
```

---

# FAQ

### I'm getting errors that the `aws-sdk` module isn't installed.

`aws-sdk` is set as a dev-dependency since it is pretty large and installed by default on AWS Lambda.

### I need to use the regular client methods for some edge case.

They are all available with an `original_` prefix:

```js
const { DynamoPlus } = require('dynamo-plus')
const documentClient = DynamoPlus()

documentClient.original_get(myParams, (err, data) => {})
// or
documentClient.original_get(myParams).promise()
```

Automatic retries don't apply when calling original methods directly.

### None of these questions seem to be questions.

That's a statement, but I see your point.
