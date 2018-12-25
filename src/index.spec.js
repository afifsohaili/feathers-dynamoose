/* globals test, expect */

import {DEFAULT_DYNAMOOSE_OPTIONS, Service} from './index';
import chance from '../tests/chance';

const modelName = 'users';
const schema = {id: {type: String, hashKey: true}};
const localUrl = 'http://localhost:8000';

test('should save a record on dynamodb table', async () => {
  const service = new Service({modelName, schema, localUrl}, {...DEFAULT_DYNAMOOSE_OPTIONS, create: true, waitForActive: true});
  const id = chance.guid();
  await service.create({id});
  const all = await service.find();
  expect(all.length).toBe(1);
});
