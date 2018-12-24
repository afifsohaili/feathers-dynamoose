/* globals test, expect, beforeAll, afterAll */

import { DEFAULT_DYNAMOOSE_OPTIONS, Service } from './index'
import DynamoDbLocal from 'dynamodb-local';
import dynamoose from 'dynamoose'

const modelName = 'users';
const schema = {id: {type: String, hashKey: true}};
const localUrl = 'http://localhost:8000';

let child;
beforeAll(async () => {
  dynamoose.AWS.config.update({ region: 'us-west-2' });
  const dynamoLocalPort = 8000;
  child = await DynamoDbLocal.launch(dynamoLocalPort, null, [], false, true); // Must be wrapped in async function
});

test('should save a record on dynamodb table', async () => {
  const service = new Service({modelName, schema, localUrl}, {...DEFAULT_DYNAMOOSE_OPTIONS, create: true, waitForActive: true});
  await service.create({id: Math.random().toString()});
  const all = await service.find();
  expect(all.length).toBe(1);
});

afterAll(async () => {
  await DynamoDbLocal.stopChild(child);
});
