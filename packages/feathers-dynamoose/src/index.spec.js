/* globals describe, it, expect */

import chance from '../tests/chance';
// eslint-disable-next-line import/named
import {Service, Schema} from '.';
import {createService, defaultSchema, randomModelName} from '../tests/model-utils';

describe('create', () => {
  it('should save a record on dynamodb table', async () => {
    const service = createService({modelName: randomModelName()});
    const id = chance.guid();
    const name = chance.name();
    await service.create({id, name});
    const all = await service.find();
    expect(all.data.length).toBe(1);
    expect(all.data[0].id).toBe(id);
    expect(all.data[0].name).toBe(name);
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

describe('get', () => {
  const hashKey = chance.word();
  const schema = {[hashKey]: {type: String, hashKey: true}, name: {type: String, rangeKey: true}, age: {type: Number}};

  it('should get the record when there is a record with the given value as hash key', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const keyword = chance.word();
    const record = await service.create({[hashKey]: chance.guid(), name: keyword});
    const expected = await service.get(record[hashKey]);
    expect(expected.name).toBe(keyword);
  });

  it('should return undefined when there is no record with the given value as hash key', async () => {
    const service = createService({modelName: randomModelName(), schema});
    await service.create({[hashKey]: chance.guid(), name: chance.word()});
    const expected = await service.get('non-existent-id');
    expect(expected).toBe(undefined);
  });

  it('should be able to use params.query to filter by range key', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const name1 = chance.name();
    const name2 = chance.name();
    const id = chance.guid();
    await service.create([
      {[hashKey]: id, name: name1},
      {[hashKey]: id, name: name2}
    ]);
    const expectedName1 = await service.get(id, {query: {name: {eq: name1}}});
    const expectedName2 = await service.get(id, {query: {name: {eq: name2}}});
    expect(expectedName1.name).toBe(name1);
    expect(expectedName2.name).toBe(name2);
  });

  it('should be able to use params.query to filter by other attributes', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const name1 = chance.name();
    const name2 = chance.name();
    const id = chance.guid();
    await service.create([
      {[hashKey]: id, name: name1, age: 5},
      {[hashKey]: id, name: name2, age: 6}
    ]);
    const expected = await service.get(id, {query: {age: 6}});
    expect(expected.name).toEqual(name2);
  });
});

describe('update', () => {
  const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};

  it('should replace the resource identified by the given id with the new data', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const record = await service.create({
      id: chance.guid(), name: originalName, age: chance.natural({max: 10}), address: chance.address()
    });
    const newAddress = chance.address();
    await service.update(record.id, {$PUT: {address: newAddress}}, {query: {name: originalName}});
    const newRecord = await service.get(record.id);
    expect(newRecord.age).toBe(undefined);
    expect(newRecord.address).toBe(newAddress);
  });

  it('should return the updated record', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const record = await service.create({
      id: chance.guid(), name: originalName, age: chance.natural({max: 10}), address: chance.address()
    });
    const newAddress = chance.address();
    const updatedRecord = await service.update(record.id, {$PUT: {address: newAddress}}, {query: {name: originalName}});
    expect(updatedRecord.age).toBe(undefined);
    expect(updatedRecord.address).toBe(newAddress);
  });
});

describe('patch', () => {
  const schema = {...defaultSchema, age: {type: Number}, address: {type: String}};

  it('should update the resource identified by the given id with the new data', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const age = chance.natural({max: 10});
    const record = await service.create({id: chance.guid(), name: originalName, age, address: chance.address()});
    const newAddress = chance.address();
    await service.patch(record.id, {$PUT: {address: newAddress}}, {query: {name: originalName}});
    const newRecord = await service.get(record.id);
    expect(newRecord.age).toBe(age);
    expect(newRecord.address).toBe(newAddress);
  });

  it('should return the updated record', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const age = chance.natural({max: 10});
    const record = await service.create({id: chance.guid(), name: originalName, age, address: chance.address()});
    const newAddress = chance.address();
    const updatedRecord = await service.patch(record.id, {$PUT: {address: newAddress}}, {query: {name: originalName}});
    expect(updatedRecord.age).toBe(age);
    expect(updatedRecord.address).toBe(newAddress);
  });

  it('should be able to accept just query params and not the ID', async () => {
    const service = createService({modelName: randomModelName(), schema});
    const originalName = 'Original Name';
    const age = chance.natural({max: 10});
    const record = await service.create({id: chance.guid(), name: originalName, age, address: chance.address()});
    const newAddress = chance.address();
    const updatedRecord = await service.patch(null, {$PUT: {address: newAddress}}, {
      query: {
        id: record.id,
        name: originalName
      }
    });
    expect(updatedRecord.age).toBe(age);
    expect(updatedRecord.address).toBe(newAddress);
  });
});

describe('remove', () => {
  it('should remove the resource identified by the given id', async () => {
    const service = createService({modelName: randomModelName()});
    const name = chance.name();
    const newRecord = await service.create({id: chance.guid(), name});
    await service.remove(newRecord.id, {query: {name}});
    const allRecords = await service.find();
    expect(allRecords.data.length).toBe(0);
  });

  it('should return the removed record', async () => {
    const service = createService({modelName: randomModelName()});
    const name = chance.name();
    const newRecord = await service.create({id: chance.guid(), name});
    const deletedRecord = await service.remove(newRecord.id, {query: {name}});
    expect(deletedRecord.name).toBe(name);
  });
});

describe('passing dynamoose.Schema object for schema', async () => {
  it('should still obtain the hashkey', async () => {
    const hashKey = 'somecoolstring';
    const schema = new Schema({
      [hashKey]: {type: String, hashKey: true},
      name: {type: String, rangeKey: true}
    }, {
      timestamps: true
    });
    const service = new Service(
      {modelName: randomModelName(), schema},
      {create: false}
    );
    expect(service.hashKey).toEqual(hashKey);
  });
});

describe('set service.id for authentication', async () => {
  it('should set the hashkey key as id', async () => {
    const hashKey = 'somecoolstring';
    const schema = new Schema({
      [hashKey]: {type: String, hashKey: true},
      name: {type: String, rangeKey: true}
    }, {
      timestamps: true
    });
    const service = new Service(
      {modelName: randomModelName(), schema},
      {create: false}
    );
    expect(service.id).toEqual(hashKey);
  });
});

describe('track keys for query', async () => {
  describe('given a Dynamoose.Schema object as schema', () => {
    it('should track the hashKey', async () => {
      const hashKey = 'somecoolstring';
      const schema = new Schema({
        [hashKey]: {type: String, hashKey: true},
        name: {type: String, rangeKey: true}
      }, {
        timestamps: true
      });
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.hashKey).toEqual(hashKey);
    });

    it('should track the rangeKey', async () => {
      const rangeKey = 'somecoolstring';
      const schema = new Schema({
        id: {type: String, hashKey: true},
        [rangeKey]: {type: String, rangeKey: true}
      }, {
        timestamps: true
      });
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.rangeKey).toEqual(rangeKey);
    });

    it('should have rangeKey equals undefined if there is no rangeKey supplied', async () => {
      const schema = new Schema({
        id: {type: String, hashKey: true},
        name: {type: String}
      }, {
        timestamps: true
      });
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.rangeKey).toEqual(undefined);
    });

    it('should track the indexes', async () => {
      const indexHashKey = 'somekey';
      const indexHashKey2 = 'justanotherkey';
      const schema = new Schema({
        id: {type: String, hashKey: true},
        name: {type: String, rangeKey: true},
        [indexHashKey]: {
          type: String,
          index: {
            global: true,
            name: indexHashKey + 'Index',
            project: ['name']
          }
        },
        [indexHashKey2]: {
          type: String,
          index: {
            global: true,
            name: indexHashKey2 + 'Index',
            project: ['name']
          }
        }
      }, {
        timestamps: true
      });
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.indexKeys).toEqual([indexHashKey, indexHashKey2]);
    });
  });

  describe('given an object as schema', () => {
    it('should track the hashKey', async () => {
      const hashKey = 'somecoolstring';
      const schema = {
        [hashKey]: {type: String, hashKey: true},
        name: {type: String, rangeKey: true}
      };
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.hashKey).toEqual(hashKey);
    });

    it('should track the rangeKey', async () => {
      const rangeKey = 'somecoolstring';
      const schema = {
        id: {type: String, hashKey: true},
        [rangeKey]: {type: String, rangeKey: true}
      };
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.rangeKey).toEqual(rangeKey);
    });

    it('should track the indexes', async () => {
      const indexHashKey = 'somekey';
      const indexHashKey2 = 'justanotherkey';
      const schema = {
        id: {type: String, hashKey: true},
        name: {type: String, rangeKey: true},
        [indexHashKey]: {
          type: String,
          index: {
            global: true,
            name: indexHashKey + 'Index',
            project: ['name']
          }
        },
        [indexHashKey2]: {
          type: String,
          index: {
            global: true,
            name: indexHashKey2 + 'Index',
            project: ['name']
          }
        }
      };
      const service = new Service(
        {modelName: randomModelName(), schema},
        {create: false}
      );
      expect(service.indexKeys).toEqual([indexHashKey, indexHashKey2]);
    });
  });
});
