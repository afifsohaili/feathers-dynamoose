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
    this.logger = logger;
    this.options = options || {};
    this.paginate = options.paginate;
    if (options.localUrl) {
      dynamoose.local(options.localUrl);
    }
    const {modelName, schema} = options;
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
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }
    return this.model.create({id: uuid(), ...data});
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return {id};
  }
}

module.exports = (
  options,
  dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS,
  logger = defaultLogger
) => new Service(options, dynamooseOptions, logger);

module.exports.Service = Service;
module.exports.DEFAULT_DYNAMOOSE_OPTIONS = DEFAULT_DYNAMOOSE_OPTIONS;
