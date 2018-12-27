/* globals describe, it, expect */

import chance from '../tests/chance';
// eslint-disable-next-line import/named
import {Service, Schema} from '.';

const defaultSchema = {id: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
const localUrl = 'http://localhost:8000';
const randomModelName = () => chance.word({length: 200});

const createService = ({modelName, ...options}) => new Service(
  {modelName, schema: defaultSchema, localUrl, ...options},
  {create: true, waitForActive: true}
);

describe('create', () => {
  it('should save a record on dynamodb table', async () => {
    const service = createService({modelName: randomModelName()});
    const id = chance.guid();
    const name = chance.name();
    await service.create({id, name});
    const all = await service.find();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(id);
    expect(all[0].name).toBe(name);
  });

  it('should return the created dynamodb record', async () => {
    const service = createService({modelName: randomModelName()});
    const id = chance.guid();
    const name = chance.name();
    const result = await service.create({id, name});
    expect(result).toMatchObject({
      id: expect.any(String),
      name
    });
  });
});

describe('find', () => {
  it('should return matching items when given the right query', async () => {
    const service = createService({modelName: randomModelName()});
    const control = {id: chance.guid(), name: chance.name()};
    const expected = {id: chance.guid(), name: chance.name()};
    await service.create([control, expected]);
    const result = await service.find({query: {name: {contains: expected.name}}});
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject(expected);
  });

  it('should not return non-matching items', async () => {
    const service = createService({modelName: randomModelName()});
    const control = {name: 'control', id: chance.guid()};
    await service.create(control);
    const result = await service.find({query: {name: {eq: 'test'}}});
    expect(result.length).toBe(0);
  });

  it('should return paginated result when options.paginate.max is present', async () => {
    const paginate = {max: 2};
    const service = createService({modelName: randomModelName(), paginate});
    const keyword = chance.word();
    const data = new Array(5).fill('').map(() => ({id: chance.guid(), name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.length).toBe(2);
  });

  it('should return all results when options.paginate.max is absent', async () => {
    const service = createService({modelName: randomModelName()});
    const recordsLength = 5;
    const keyword = chance.word();
    const data = new Array(recordsLength).fill('').map(() => ({id: chance.guid(), name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.length).toBe(recordsLength);
  });
});

describe('get', () => {
  it('should get the record when there is a record with the given value as hash key', async () => {
    const hashKey = chance.word();
    const schema = {[hashKey]: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
    const service = createService({modelName: randomModelName(), schema});
    const keyword = chance.word();
    const record = await service.create({[hashKey]: chance.guid(), name: keyword});
    const expected = await service.get(record[hashKey]);
    const all = await service.find();
    expect(expected.name).toBe(keyword);
  });

  it('should return undefined when there is no record with the given value as hash key', async () => {
    const hashKey = chance.word();
    const schema = {[hashKey]: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
    const service = createService({modelName: randomModelName(), schema});
    await service.create({[hashKey]: chance.guid(), name: chance.word()});
    const expected = await service.get('non-existent-id');
    expect(expected).toBe(undefined);
  });
});

describe('update', () => {
  it('should replace the resource identified by the given id with the new data', async () => {
    const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const record = await service.create({
      id: chance.guid(), name: originalName, age: chance.natural({max: 10}), address: chance.address()
    });
    const newAddress = chance.address();
    await service.update({id: record.id, name: originalName}, {$PUT: {address: newAddress}});
    const newRecord = await service.get(record.id);
    expect(newRecord.age).toBe(undefined);
    expect(newRecord.address).toBe(newAddress);
  });

  it('should return the updated record', async () => {
    const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const record = await service.create({
      id: chance.guid(), name: originalName, age: chance.natural({max: 10}), address: chance.address()
    });
    const newAddress = chance.address();
    const updatedRecord = await service.update({id: record.id, name: originalName}, {$PUT: {address: newAddress}});
    expect(updatedRecord.age).toBe(undefined);
    expect(updatedRecord.address).toBe(newAddress);
  });
});

describe('patch', () => {
  it('should update the resource identified by the given id with the new data', async () => {
    const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const age = chance.natural({max: 10});
    const record = await service.create({id: chance.guid(), name: originalName, age, address: chance.address()});
    const newAddress = chance.address();
    await service.patch({id: record.id, name: originalName}, {$PUT: {address: newAddress}});
    const newRecord = await service.get(record.id);
    expect(newRecord.age).toBe(age);
    expect(newRecord.address).toBe(newAddress);
  });

  it('should return the updated record', async () => {
    const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const age = chance.natural({max: 10});
    const record = await service.create({id: chance.guid(), name: originalName, age, address: chance.address()});
    const newAddress = chance.address();
    const updatedRecord = await service.patch({id: record.id, name: originalName}, {$PUT: {address: newAddress}});
    expect(updatedRecord.age).toBe(age);
    expect(updatedRecord.address).toBe(newAddress);
  });
});

describe('remove', () => {
  it('should remove the resource identified by the given id', async () => {
    const service = createService({modelName: randomModelName()});
    const name = chance.name();
    const newRecord = await service.create({id: chance.guid(), name});
    await service.remove({id: newRecord.id, name});
    const allRecords = await service.find();
    expect(allRecords.length).toBe(0);
  });

  it('should return the removed record', async () => {
    const service = createService({modelName: randomModelName()});
    const name = chance.name();
    const newRecord = await service.create({id: chance.guid(), name});
    const deletedRecord = await service.remove({id: newRecord.id, name});
    expect(deletedRecord.name).toBe(name);
  });
});

describe('passing dynamoose.Schema object for schema', () => {
  it('should still obtain the hashkey', () => {
    const hashKey = 'somecoolstring';
    const schema = new Schema({
      [hashKey]: {type: String, hashKey: true},
      name: {type: String, rangeKey: true}
    }, {
      timestamps: true
    });
    const service = new Service(
      {modelName: randomModelName(), schema, localUrl},
      {create: true, waitForActive: true}
    );
    expect(service.hashKey).toEqual(hashKey);
  });
});
