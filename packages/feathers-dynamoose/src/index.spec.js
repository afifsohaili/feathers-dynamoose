/* globals describe, it, expect */

import chance from '../tests/chance';
import {spy} from 'sinon';
// eslint-disable-next-line import/named
import {Service, Schema} from '.';
import {createService, defaultSchema, randomModelName} from '../tests/model-utils';

const passArgsToSpy = spy => args => {
  spy(args);
  return spy;
};

const modelStub = spy => ({
  limit: passArgsToSpy(spy),
  all: passArgsToSpy(spy),
  exec: () => ({scannedCount: 0, count: 0, timesScanned: 0, data: []})
});

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

describe('find', () => {
  it('should return matching items when given the right query', async () => {
    const service = createService({modelName: randomModelName()});
    const control = {id: chance.guid(), name: chance.name()};
    const expected = {id: chance.guid(), name: chance.name()};
    await service.create([control, expected]);
    const result = await service.find({query: {name: {contains: expected.name}}});
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toMatchObject(expected);
  });

  it('should return limited items when given the right query limited to the $limit param', async () => {
    const service = createService({modelName: randomModelName()});
    const keyword = chance.word();
    const randomRecord = () => ({id: chance.guid(), name: keyword + chance.name()});
    await service.create([randomRecord(), randomRecord(), randomRecord()]);
    const result = await service.find({query: {name: {contains: keyword}, $limit: 1}});
    expect(result.data.length).toBe(1);
  });

  it('should compare values using eq should params.query does not provide valid dynamodb matchers', async () => {
    const service = createService({modelName: randomModelName()});
    const expected = {id: chance.guid(), name: chance.name()};
    const control = {id: chance.guid(), name: expected.name + chance.name()};
    await service.create([expected, control]);
    const result = await service.find({query: {name: expected.name}});
    expect(result.data.length).toBe(1);
  });

  it('should not return non-matching items', async () => {
    const service = createService({modelName: randomModelName()});
    const control = {name: 'control', id: chance.guid()};
    await service.create(control);
    const result = await service.find({query: {name: {eq: 'test'}}});
    expect(result.data.length).toBe(0);
  });

  it('should return paginated result when options.paginate.max is present', async () => {
    const paginate = {max: 2};
    const service = createService({modelName: randomModelName(), paginate});
    const keyword = chance.word();
    const data = new Array(5).fill('').map(() => ({id: chance.guid(), name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.data.length).toBe(2);
  });

  it('should return all results when options.paginate.max is absent', async () => {
    const service = createService({modelName: randomModelName()});
    const recordsLength = 5;
    const keyword = chance.word();
    const data = new Array(recordsLength).fill('').map(() => ({id: chance.guid(), name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.data.length).toBe(recordsLength);
  });

  it('should return timesScanned and scannedCount', async () => {
    const service = createService({modelName: randomModelName()});
    const recordsLength = 5;
    const keyword = chance.word();
    const data = new Array(recordsLength).fill('').map(() => ({id: chance.guid(), name: keyword + chance.word()}));
    await service.create(data);
    const result = await service.find({query: {name: {contains: keyword}}});
    expect(result.data.length).toBe(recordsLength);
    expect(result.scannedCount).toBe(recordsLength);
    expect(result.count).toBe(recordsLength);
    expect(result.timesScanned).toBe(1); // 1 because the sample size is small.
  });

  it('should use query instead of scan when hashkey exists in params.query', async () => {
    const createService = ({modelName, ...options}, spy) => new Service(
      {modelName, schema: defaultSchema, ...options},
      {create: true, waitForActive: true},
      spy
    );

    const scanSpy = spy();
    const querySpy = spy();
    const dynamooseStub = {
      local: spy(),
      model: () => ({
        scan: () => modelStub(scanSpy),
        query: () => modelStub(querySpy)
      }),
      Schema
    };
    const service = createService({modelName: randomModelName()}, dynamooseStub);
    await service.find({query: {id: {eq: chance.string()}}});
    expect(scanSpy.called).toBe(false);
    expect(querySpy.called).toBe(true);
  });

  it('should use scan instead of query when hashkey does not exist in params.query', async () => {
    const createService = ({modelName, ...options}, spy) => new Service(
      {modelName, schema: defaultSchema, ...options},
      {create: true, waitForActive: true},
      spy
    );

    const scanSpy = spy();
    const querySpy = spy();
    const dynamooseStub = {
      local: spy(),
      model: () => ({
        scan: () => modelStub(scanSpy),
        query: () => modelStub(querySpy)
      }),
      Schema
    };
    const service = createService({modelName: randomModelName()}, dynamooseStub);
    await service.find({query: {name: {eq: chance.string()}}});
    expect(scanSpy.called).toBe(true);
    expect(querySpy.called).toBe(false);
  });

  it('should use query instead of scan when index hashkey exists in params.query', async () => {
    const additionalFields = {
      gender: {
        type: String,
        index: {
          global: true,
          name: 'GenderIndex',
          project: ['birthdate']
        }
      },
      birthdate: {type: String}
    };
    const schema = {...defaultSchema, ...additionalFields};
    const createService = ({modelName, ...options}, spy) => new Service(
      {modelName, schema, ...options},
      {create: true, waitForActive: true},
      spy
    );

    const scanSpy = spy();
    const querySpy = spy();
    const dynamooseStub = {
      local: spy(),
      model: () => ({
        scan: () => modelStub(scanSpy),
        query: () => modelStub(querySpy)
      }),
      Schema
    };
    const service = createService({modelName: randomModelName()}, dynamooseStub);
    await service.find({query: {gender: {eq: chance.string()}}});
    expect(scanSpy.called).toBe(false);
    expect(querySpy.called).toBe(true);
  });

  it('should use scan instead of query when index hashkey does not exist in params.query', async () => {
    const additionalFields = {
      gender: {
        type: String,
        index: {
          global: true,
          name: 'GenderIndex',
          project: ['birthdate']
        }
      },
      birthdate: {type: String}
    };
    const schema = {...defaultSchema, ...additionalFields};
    const createService = ({modelName, ...options}, spy) => new Service(
      {modelName, schema, ...options},
      {create: true, waitForActive: true},
      spy
    );

    const scanSpy = spy();
    const querySpy = spy();
    const dynamooseStub = {
      local: spy(),
      model: () => ({
        scan: () => modelStub(scanSpy),
        query: () => modelStub(querySpy)
      }),
      Schema
    };
    const service = createService({modelName: randomModelName()}, dynamooseStub);
    await service.find({query: {birthdate: {eq: chance.string()}}});
    expect(scanSpy.called).toBe(true);
    expect(querySpy.called).toBe(false);
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
    expect(allRecords.data.length).toBe(0);
  });

  it('should return the removed record', async () => {
    const service = createService({modelName: randomModelName()});
    const name = chance.name();
    const newRecord = await service.create({id: chance.guid(), name});
    const deletedRecord = await service.remove({id: newRecord.id, name});
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
