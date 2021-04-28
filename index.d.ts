import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb'

export class DynamoPlusClient extends DocumentClient {
  /**
   * Returns the attributes of one or more items from one or more tables by delegating to AWS.DynamoDB.batchGetItem().
   */
  batchGet(params: DocumentClient.BatchGetItemInput): Promise<DocumentClient.BatchGetItemOutput>
  /**
   * Puts or deletes multiple items in one or more tables by delegating to AWS.DynamoDB.batchWriteItem().
   */
  batchWrite(params: DocumentClient.BatchWriteItemInput): Promise<DocumentClient.BatchWriteItemOutput>
  /**
   * Deletes a single item in a table by primary key by delegating to AWS.DynamoDB.deleteItem().
   */
  delete(params: DocumentClient.DeleteItemInput): Promise<DocumentClient.DeleteItemOutput>
  /**
   * Returns a set of attributes for the item with the given primary key by delegating to AWS.DynamoDB.getItem().
   */
  get(params: DocumentClient.GetItemInput): Promise<DocumentClient.GetItemOutput>
  /**
   * Creates a new item, or replaces an old item with a new item by delegating to AWS.DynamoDB.putItem().
   */
  put(params: DocumentClient.PutItemInput): Promise<DocumentClient.PutItemOutput>
  /**
   * Directly access items from a table by primary key or a secondary index.
   */
  query(params: DocumentClient.QueryInput): Promise<DocumentClient.QueryOutput>
  /**
   * Returns one or more items and item attributes by accessing every item in a table or a secondary index.
   */
  scan(params: DocumentClient.ScanInput): Promise<DocumentClient.ScanOutput>
  /**
   * Edits an existing item's attributes, or adds a new item to the table if it does not already exist by delegating to AWS.DynamoDB.updateItem().
   */
  update(params: DocumentClient.UpdateItemInput): Promise<DocumentClient.UpdateItemOutput>

  /**
   * Atomically retrieves multiple items from one or more tables (but not from indexes) in a single account and region.
   */
  transactGet(params: DocumentClient.TransactGetItemsInput): Promise<DocumentClient.TransactGetItemsOutput>

  /**
   * Synchronous write operation that groups up to 10 action requests
   */
  transactWrite(params: DocumentClient.TransactWriteItemsInput): Promise<DocumentClient.TransactWriteItemsOutput>

  // -- Custom methods  w/ handcrafted typings below this line. --

  /**
   * Similar to get(), but takes a Keys array pointing to multiple documents to be removed.
   *
   * It will automatically perform an unlimited amount of batchWrite() requests until the list has been processed.
   */
   getAll(params: GetAllRequest): Promise<DocumentClient.ItemList>

  /**
   * Similar to delete(), but takes a Keys array pointing to multiple documents to be removed.
   *
   * It will automatically perform an unlimited amount of batchWrite() requests until the list has been processed.
   */
  deleteAll(params: DeleteAllRequest): Promise

  /**
   * Similar to put(), but takes an Items property with multiple documents to be written.
   *
   * It will automatically perform an unlimited amount of batchWrite() requests until the list has been processed.
   */
  putAll(params: PutAllRequest): Promise

  /**
   * Scan a table into memory
   */
  scanAll(params: DocumentClient.ScanInput): Promise<DocumentClient.ItemList>

  /**
   * Returns an EventEmitter that you can subscribe on to be
   * notified of each batch of items from the table. This is
   * an especially useful feature when dealing with enormous
   * datasets that wont fit in memory but don't want to
   * implement your own pagination to deal with chunks.
   */
  scanStream(params: DocumentClient.ScanInput, parallelScans: number | AWS.DynamoDB.DocumentClient.ScanInput[]): ScanEmitter

  /**
   * Similar to stream, but waits for all eventlisteners to resolve before recursing the next batch.
   * If parallel scanning is in effect, the synchronisity will only apply on a per-segment basis.
   */
  scanStreamSync(params: DocumentClient.ScanInput, parallelScans: number | AWS.DynamoDB.DocumentClient.ScanInput[]): ScanEmitterSynchronous

  /**
   * Load all pages from a query into memory.
   */
  queryAll(params: DocumentClient.QueryInput): Promise<DocumentClient.ItemList>

  /**
   * Returns an EventEmitter that you can subscribe on to be
   * notified of each batch of matching items from the table.
   * This is an especially useful feature when dealing with
   * enormous datasets that wont fit in memory but don't want
   * to implement your own pagination to deal with chunks.
   */
  queryStream(params: DocumentClient.QueryInput): QueryEmitter

  /**
   * Similar to queryStream(), but waits for all eventlisteners to resolve before reading the next page.
   */
  queryStreamSync(params: DocumentClient.QueryInput): QueryEmitterSynchronous
}

export interface GetAllRequest {
  TableName: string

  /**
   * An unlimited amount of keys to fetch.
   */
  Keys: DocumentClient.Key[]

  /**
   * The amount of requests to write per batch. Defaults to the DynamoDB maximum of 100.
   */
  BatchSize: Number
}

export interface DeleteAllRequest {
  TableName: string

  /**
   * An unlimited amount of keys to delete.
   */
  Keys: DocumentClient.Key[]

  /**
   * The amount of requests to write per batch. Defaults to the DynamoDB maximum of 25.
   */
  BatchSize: Number
}

export interface PutAllRequest {
  TableName: string

  /**
   * An unlimited amount of documents to perform Put with.
   */
  Items: DocumentClient.PutItemInputAttributeMap[]

  /**
   * The amount of items to write per batch. Defaults to 25.
   *
   * batchWrite() supports up to 25 items at once.
   * If you're dealing with VERY large documents, you may need to lower the size of the batches since batchWrite only supports up to 16MB at a time.
   */
  BatchSize: Number
}

export class DynamoPlusEmitter extends EventEmitter {
  on(event: 'data', callback: (data: any) => void)

  on(event: 'items', callback: (items: DocumentClient.ItemList) => void)

  on(event: 'done', callback: () => void)

  on(event: 'error', callback: (err: Error) => void)
}

export class ScanEmitter extends DynamoPlusEmitter {
  on(event: 'data', callback: (data: DocumentClient.ScanOutput) => void)
}

export class ScanEmitterSynchronous extends ScanEmitter {
  on(event: 'data', callback: (data: DocumentClient.ScanOutput) => Promise)

  on(event: 'items', callback: (items: DocumentClient.ItemList) => Promise)
}

export class QueryEmitter extends DynamoPlusEmitter{
  on(event: 'data', callback: (data: DocumentClient.QueryOutput) => void)
}

export class QueryEmitterSynchronous extends QueryEmitter {
  on(event: 'data', callback: (data: DocumentClient.QueryOutput) => Promise)

  on(event: 'items', callback: (items: DocumentClient.ItemList) => Promise)
}

declare namespace DynamoPlusModule {
  export function DynamoPlus(options?: DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration): DynamoPlusClient

  /**
   * Names of exceptions that indicate a retryable error (i.e. you can perform the request again and get a different result.)
   */
  export const RetryableExceptions: string[]
}

export = DynamoPlusModule
