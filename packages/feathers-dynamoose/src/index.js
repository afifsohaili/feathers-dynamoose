/* eslint-disable no-unused-vars */
import dynamooseModule from 'dynamoose';
import defaultLogger, {NO_MAX_OPTION_WARNING} from './logger';
import findService from './find';
import jsonify from './jsonify';

const getIndexKeysFromSchema = schema => {
  if (schema && schema.indexes) {
    return Object.values(schema.indexes.global).map(index => index.name);
  }
  const indexKeys = Object.keys(schema).filter(key => schema[key].index && schema[key].index.global);
  return Array.isArray(indexKeys) ? indexKeys : [];
};

const getHashKeyFromSchema = schema => schema instanceof dynamooseModule.Schema && schema.hashKey ?
  schema.hashKey.name :
  Object.keys(schema).filter(key => schema[key].hashKey)[0];

const getRangeKeyFromSchema = schema => schema instanceof dynamooseModule.Schema ?
  schema.rangeKey && schema.rangeKey.name :
  Object.keys(schema).filter(key => schema[key].rangeKey)[0];

export const {Schema} = dynamooseModule;
export const DEFAULT_DYNAMOOSE_OPTIONS = {
  create: false,
  update: false,
  waitForActive: false,
  streamOptions: {
    enable: false
  },
  serverSideEncryption: false
};

export class Service {
  constructor(options, dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS, dynamoose = dynamooseModule, logger = defaultLogger) {
    this.options = options || {};
    this.logger = logger;
    if (!this.options.paginate || !this.options.paginate.max) {
      this.logger.warn(NO_MAX_OPTION_WARNING);
    }
    this.paginate = this.options.paginate;
    if (this.options.localUrl) {
      dynamoose.local(this.options.localUrl);
    }
    const {modelName, schema} = this.options;
    this.hashKey = getHashKeyFromSchema(schema);
    this.rangeKey = getRangeKeyFromSchema(schema);
    this.indexKeys = getIndexKeysFromSchema(schema);
    this.model = dynamoose.model(modelName, schema, dynamooseOptions);
    this.id = this.hashKey;
  }

  async find(params = {query: {}}) {
    const {hashKey, indexKeys} = this;
    return findService(this.model, {hashKey, indexKeys}, this.paginate).find(params.query);
  }

  async get(id, params) {
    return this.model.queryOne({[this.hashKey]: {eq: id}}).exec();
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }
    const record = await this.model.create(data);
    return jsonify(record);
  }

  async update(id, data, params) {
    await this.model.delete(id);
    await this.model.create(id);
    const result = await this.model.update(id, data);
    return jsonify(result);
  }

  async patch(id, data, params) {
    const result = await this.model.update(id, data);
    return jsonify(result);
  }

  async remove(id, params) {
    const result = await this.model.delete(id);
    return jsonify(result);
  }
}

export default (
  options,
  dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS
) => new Service(options, dynamooseOptions);
