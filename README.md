# ![Dynamo Plus](logo.svg)

[ ![npm version](https://img.shields.io/npm/v/dynamo-plus.svg?style=flat) ](https://npmjs.org/package/dynamo-plus "View this project on npm") [![Types, Tests and Linting](https://github.com/Sleavely/dynamo-plus/actions/workflows/test.yml/badge.svg)](https://github.com/Sleavely/dynamo-plus/actions/workflows/test.yml) [ ![Issues](https://img.shields.io/github/issues/Sleavely/dynamo-plus.svg) ](https://github.com/Sleavely/dynamo-plus/issues)

> Extend and supercharge your DynamoDB DocumentClient with infinite batching.

# Installation

```shell
npm i dynamo-plus
```

```js
import { DynamoPlus } from 'dynamo-plus'
const dynamo = new DynamoPlus({
  region: 'eu-west-1',
})

const regularDynamoParams = {
  TableName: 'myTable',
  Key: {
    myKey: '1337'
  }
}
const data = await dynamo.get(regularDynamoParams)
```

# Features

- Simplified stack traces that dont bury errors in AWS SDK internals
- Optionally define the expected return type of items when using Typescript
- `get()` returns the document or `undefined`
- New methods for batching unlimited amounts of data
  - [getAll(params)](#methods-getall)
  - [deleteAll(params)](#methods-deleteall)
  - [putAll(params)](#methods-putall)
  - [queryAll(params)](#methods-queryall)
  - [queryIterator(params[, pageSize])](#methods-queryiterator)
  - [scanAll(params)](#methods-scanall)
  - [scanIterator(params[, pageSize[, parallelScans]])](#methods-scaniterator)

## Optional return types

On methods that return documents you can have them explicitly typed from the get-go:

```typescript
interface User {
  id: string
  name: string
  age: number
}
const user = await dynamo.get<User>({
  TableName: 'users',
  Key: { id: 'agent47' },
})
// user is now either User or undefined

const users = await dynamo.getAll<User>({
  TableName: 'users',
  Keys: [
    { id: 'eagle-1' },
    { id: 'pelican-1' }
  ],
})
// users is now Array<User>

const moreUsers = await dynamo.scanAll<User>({ TableName: 'users' })
// Array<User>
```

## New method for performing batchGet requests in chunks

The built-in _batchRead_ method can be used for fetching multiple documents by their primary keys, but it requires you to handle chunking and unprocessed items yourself. DynamoPlus adds a _getAll_ method that does the heavy lifting for you.

<a name="methods-getall"></a>
### getAll(params)

It's like _batchGet_, but with the simple syntax of _get_.

- **params** `Object`
  - **TableName**
  - **Keys** - An array of key objects equivalent to `Key` in _get()_.
  - **BatchSize** - Optional custom batch size. Defaults to 100 which the maximum permitted value by DynamoDB.

_getAll()_ returns

```js
const params = {
  TableName: 'users',
  Keys: [{ userId: '1' }, { userId: '2' }, /* ... */ { userId: '999' }]
}

const response = await dynamo.getAll(params)
// response now contains ALL documents, not just the first 100
```

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
await dynamo.deleteAll(params)
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
await dynamo.putAll(params)
```

---

## New methods for query()

Query has new sibling methods that automatically paginate through resultsets for you.

<a name="methods-queryall"></a>
### queryAll(params[, pageSize])

Resolves with the entire array of matching items.

- **params** - [AWS.DynamoDB.DocumentClient.query() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property)


```js
const params = {
  TableName : 'items',
  IndexName: 'articleNo-index',
  KeyConditionExpression: 'articleNo = :val',
  ExpressionAttributeValues: { ':val': articleNo }
}
const response = await dynamo.queryAll(params)
// response now contains ALL items with the articleNo, not just the first 1MB
```

---

<a name="methods-queryiterator"></a>
### queryIterator(params[, pageSize])

- **params** - [AWS.DynamoDB.DocumentClient.query() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property)

Like [scanIterator](#methods-scaniterator), but for queries.

---

## New methods for scan()

We've supercharged _scan()_ for those times when you want to recurse through entire tables.

<a name="methods-scanall"></a>
### scanAll(params[, pageSize])

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

<a name="methods-scaniterator"></a>
### scanIterator(params[, pageSize[, parallelScanSegments]])

An async generator-driven approach to recursing your tables. This is a powerful tool when you have datasets that are too large to keep in memory all at once.

To spread out the workload across your table partitions you can define a number of `parallelScanSegments`. DynamoPlus will launch concurrent scans and yield results on the fly.

- **params** - [AWS.DynamoDB.DocumentClient.scan() parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property)
- **pageSize** - _integer_ (_Default: 100_) How many items to retrieve per API call. (DynamoPlus automatically fetches all the pages regardless)
- **parallelScans** - _integer_ (_Default: 1_) Amount of segments to split the scan operation into. It also accepts an array of individual segment options such as LastEvaluatedKey, the length of the array then decides the amount of segments.

```js
const usersIterator = dynamoPlus.scanIterator({ TableName: 'users' })
for await (const user of usersIterator) {
  await sendNewsletter(user.email)
}
```

---

# FAQ

### Can I interact with the DocumentClient directly?

Yes, its accessible via `.client`:

```js
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { DynamoPlus } from 'dynamo-plus'
const dynamo = new DynamoPlus()

const command = new DescribeTableCommand({ TableName: 'my-table' })
dynamo.client.send(command)
```

### How do I upgrade from v1 to v2?

DynamoPlus 2.0.0 introduces a significant rewrite. Changes include:

* Rewritten from the ground up using modern tools and syntax, natively producing correct type definitions

* `aws-sdk` v2 has been replaced with `@aws-sdk/*` v3 and are now explicit dependencies

* `DynamoPlus` is now a class that you instantiate with `new`, similar to the AWS clients
  ```ts
  const dynamo = new DynamoPlus({ region: 'eu-west-1' })
  ```

* `queryStream` and `queryStreamSync` have been replaced with `queryIterator`
  ```js
  const params = {
    TableName: 'users',
    IndexName: 'orgs-index',
    KeyConditionExpression: "organisationId = :val",
    ExpressionAttributeValues: { ":val": organisationId },
  }
  const queryResults = dynamo.queryIterator(params)
  for await (const user of queryResults) {
    console.log(user)
  }
  ```

* `scanStream` and `scanStreamSync` have been replaced with `scanIterator`
  ```js
  const params = {
    TableName: 'users',
  }
  const scanResults = dynamo.scanIterator(params)
  for await (const user of scanResults) {
    console.log(user)
  }
  ```
