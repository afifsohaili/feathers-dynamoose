import {createLogger, format, transports} from 'winston';

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // To see more detailed errors, change this to 'debug'
  level: 'info',
  format: format.combine(
    format.splat(),
    format.simple()
  ),
  transports: [
    new transports.Console()
  ]
});

export const NO_MAX_OPTION_WARNING =
  'WARNING: paginate.max option is empty. feathers-dynamoose will perform a full ' +
  'scan on the table. Set paginate.max in your config/default.json to limit entry.';

export default logger;
