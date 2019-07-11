/* globals describe, it, expect */
import {spy} from 'sinon';
import chance from '../tests/chance';
import {createService, defaultSchema, randomModelName} from '../tests/model-utils';
import {Schema, Service} from '.';

const passArgsToSpy = spy => args => {
  spy(args);
  return spy;
};

const modelStub = spy => ({
  limit: passArgsToSpy(spy),
  all: passArgsToSpy(spy),
  exec: () => ({scannedCount: 0, count: 0, timesScanned: 0, data: []})
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

  it('should return just the attributes defined by $select query', async () => {
    const additionalFields = {
      gender: {type: String},
      birthdate: {type: String}
    };
    const schema = {...defaultSchema, ...additionalFields};

    const service = createService({modelName: randomModelName(), schema});
    const data = {id: chance.guid(), name: chance.name(), gender: chance.gender(), birthdate: chance.date().toString()};
    await service.create(data);
    const result = await service.find({query: {$select: ['gender', 'id']}});
    const {gender, id} = data;
    expect(result.data[0]).toEqual({gender, id});
  });
});
