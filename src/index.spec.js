/* globals describe, it, expect */

import {Service} from './index';
import chance from '../tests/chance';

const schema = {id: {type: String, hashKey: true}, name: {type: String, hashKey: true}};
const localUrl = 'http://localhost:8000';

const createService = modelName => new Service({modelName, schema, localUrl}, {create: true, waitForActive: true});

describe('create', () => {
  it('create should save a record on dynamodb table', async () => {
    const service = createService(chance.word({length: 200}));
    const name = chance.name();
    await service.create({name});
    const all = await service.find();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe(name);
  });

  it('create should assign a unique uuid to the table', async () => {
    const service = createService(chance.word({length: 200}));
    const name = chance.name();
    await service.create({name});
    const all = await service.find();
    expect(all.length).toBe(1);
    expect(all[0].id).toEqual(expect.any(String));
    expect(all[0].id.length).toBeGreaterThan(0);
  });

  it('create should return the created dynamodb record', async () => {
    const service = createService(chance.word({length: 200}));
    const name = chance.name();
    const result = await service.create({name});
    expect(result).toMatchObject({
      id: expect.any(String),
      name
    });
  });
});
