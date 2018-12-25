/* globals describe, it, expect */

import chance from '../tests/chance';
// eslint-disable-next-line import/named
import {Service} from '.';

const schema = {id: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
const localUrl = 'http://localhost:8000';

const createService = ({modelName, ...options}) => new Service({modelName, schema, localUrl, ...options}, {create: true, waitForActive: true});

describe('create', () => {
  it('should save a record on dynamodb table', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const name = chance.name();
    await service.create({name});
    const all = await service.find();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe(name);
  });

  it('should assign a unique uuid to the table', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const name = chance.name();
    await service.create({name});
    const all = await service.find();
    expect(all.length).toBe(1);
    expect(all[0].id).toEqual(expect.any(String));
    expect(all[0].id.length).toBeGreaterThan(0);
  });

  it('should return the created dynamodb record', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const name = chance.name();
    const result = await service.create({name});
    expect(result).toMatchObject({
      id: expect.any(String),
      name
    });
  });
});

describe('find', () => {
  it('should return matching items when given the right query', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const control = chance.name();
    const expected = chance.name();
    await service.create([{name: control}, {name: expected}]);
    const result = await service.find({query: {name: {contains: expected}}});
    expect(result.length).toBe(1);
    expect(result[0].name).toBe(expected);
  });

  it('should not return non-matching items', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const control = 'control';
    await service.create({name: control});
    const result = await service.find({query: {name: {eq: 'test'}}});
    expect(result.length).toBe(0);
  });

  it('should return paginated result when options.paginate.max is present', async () => {
    const paginate = {max: 2};
    const service = createService({modelName: chance.word({length: 200}), paginate});
    const keyword = chance.word();
    const data = new Array(5).fill('').map(() => ({name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.length).toBe(2);
  });

  it('should return all results when options.paginate.max is absent', async () => {
    const service = createService({modelName: chance.word({length: 200})});
    const recordsLength = 5;
    const keyword = chance.word();
    const data = new Array(recordsLength).fill('').map(() => ({name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.length).toBe(recordsLength);
  });
});

describe('get', () => {
  it('should get the record when there is a record with the given value as hash key', async () => {
    const hashKey = chance.word();
    const schema = {[hashKey]: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
    const service = createService({modelName: chance.word({length: 200}), schema});
    const keyword = chance.word();
    const record = await service.create({name: keyword});
    const expected = await service.get(record[hashKey]);
    expect(expected.name).toBe(keyword);
  });

  it('should return undefined when there is no record with the given value as hash key', async () => {
    const hashKey = chance.word();
    const schema = {[hashKey]: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
    const service = createService({modelName: chance.word({length: 200}), schema});
    await service.create({name: chance.word()});
    const expected = await service.get('non-existent-id');
    expect(expected).toBe(undefined);
  });
});
