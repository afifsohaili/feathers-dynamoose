import jsonify from './jsonify';

const shouldUseQuery = (filters, {hashKey, indexKeys}) => {
  const hasGlobalIndex = Object.keys(filters)
    .filter(key => indexKeys.includes(key))
    .filter(indexKey => filters[indexKey].eq || typeof filters[indexKey] === 'string')
    .length > 0;
  const hasHashKey = (filters[hashKey] && filters[hashKey].eq) || typeof filters[hashKey] === 'string';
  return hasHashKey || hasGlobalIndex;
};

const performQuery = async (model, filters, $limit, pagination) => {
  const queryOperation = model.query(filters);
  if ($limit) {
    queryOperation.limit($limit);
  } else if (pagination && pagination.max) {
    queryOperation.limit(pagination.max);
  } else {
    queryOperation.all();
  }

  const result = await queryOperation.exec();
  return {
    scannedCount: result.scannedCount,
    count: result.count,
    timesScanned: result.timesScanned,
    data: jsonify(result)
  };
};

const performScan = async (model, filters, $limit, pagination) => {
  const scanOperation = model.scan(filters);
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
};

const findService = (model, keys, pagination) => ({
  find: async query => {
    const {$limit, ...filters} = query || {};
    if (shouldUseQuery(filters, keys)) {
      return performQuery(model, filters, $limit, pagination);
    }
    return performScan(model, filters, $limit, pagination);
  }
});

export default findService;
