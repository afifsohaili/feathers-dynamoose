/* eslint-disable no-unused-vars */
import dynamoose from 'dynamoose';
import uuid from './uuid';
import defaultLogger, {NO_MAX_OPTION_WARNING} from './logger';

const DEFAULT_DYNAMOOSE_OPTIONS = {
  create: false,
  update: false,
  waitForActive: false,
  streamOptions: {
    enable: false
  },
  serverSideEncryption: false
};

class Service {
  constructor(options, dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS, logger = defaultLogger) {
    this.options = options || {};
    this.logger = logger;
    this.paginate = this.options.paginate;
    if (this.options.localUrl) {
      dynamoose.local(this.options.localUrl);
    }
    const {modelName, schema} = this.options;
    this.hashKey = Object.keys(this.options.schema).filter(key => {
      return this.options.schema[key].hashKey;
    })[0];
    this.model = dynamoose.model(modelName, schema, dynamooseOptions);
  }

  async find(params = {}) {
    const pagination = this.paginate;
    if (!pagination || !pagination.max) {
      this.logger.warn(NO_MAX_OPTION_WARNING);
    }
    const scanOperation = this.model.scan(params.query);
    if (pagination && pagination.max) {
      scanOperation.limit(pagination.max);
    } else {
      scanOperation.all();
    }
    return scanOperation.exec();
  }

  async get(id, params) {
    return this.model.queryOne({[this.hashKey]: {eq: id}}).exec();
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }
    return this.model.create({[this.hashKey]: uuid(), ...data});
  }

  async update(id, data, params) {
    await this.model.delete(id);
    await this.model.create(id);
    await this.model.update(id, data);
  }

  async patch(id, data, params) {
    await this.model.update(id, data);
  }

  async remove(id, params) {
    await this.model.delete(id);
  }
}

module.exports = (
  options,
  dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS,
  logger = defaultLogger
) => new Service(options, dynamooseOptions, logger);

module.exports.Service = Service;
module.exports.DEFAULT_DYNAMOOSE_OPTIONS = DEFAULT_DYNAMOOSE_OPTIONS;
