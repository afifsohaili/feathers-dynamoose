/* eslint-disable no-unused-vars */
import dynamoose from 'dynamoose';
import defaultLogger, {NO_MAX_OPTION_WARNING} from './logger';

export const DEFAULT_DYNAMOOSE_OPTIONS = {
  create: false,
  update: false,
  waitForActive: false,
  streamOptions: {
    enable: false
  },
  serverSideEncryption: false
};
export const {Schema} = dynamoose;
const jsonify = model => JSON.parse(JSON.stringify(model));

export class Service {
  constructor(options, dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS, logger = defaultLogger) {
    this.options = options || {};
    this.logger = logger;
    this.paginate = this.options.paginate;
    if (this.options.localUrl) {
      dynamoose.local(this.options.localUrl);
    }
    const {modelName, schema} = this.options;
    this.hashKey = schema && schema.hashKey ?
      schema.hashKey.name :
      Object.keys(schema).filter(key => schema[key].hashKey)[0];
    this.model = dynamoose.model(modelName, schema, dynamooseOptions);
    this.id = this.hashKey;
  }

  async find(params = {query: {}}) {
    const pagination = this.paginate;
    if (!pagination || !pagination.max) {
      this.logger.warn(NO_MAX_OPTION_WARNING);
    }
    const {$limit, ...filters} = params.query;
    const scanOperation = this.model.scan(filters);
    if ($limit) {
      scanOperation.limit($limit);
    } else if (pagination && pagination.max) {
      scanOperation.limit(pagination.max);
    } else {
      scanOperation.all();
    }
    const result = await scanOperation.exec();
    return {
      scannedCount: result.scannedCount,
      count: result.count,
      timesScanned: result.timesScanned,
      data: jsonify(result)
    };
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
  dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS,
  logger = defaultLogger
) => new Service(options, dynamooseOptions, logger);
