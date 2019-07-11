import {Service} from '../src';
import chance from './chance';

const localUrl = 'http://localhost:8000';

export const defaultSchema = {id: {type: String, hashKey: true}, name: {type: String, rangeKey: true}};
export const randomModelName = () => chance.word({length: 200});

export const createService = ({modelName, ...options}) => new Service(
  {modelName, schema: defaultSchema, localUrl, ...options},
  {create: true, waitForActive: true}
);
