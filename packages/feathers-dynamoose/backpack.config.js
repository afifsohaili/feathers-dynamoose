const isProd = Boolean(process.env.PRODUCTION_MODE);

module.exports = {
  webpack: config => {
    return {
      ...config,
      mode: isProd ? 'production' : 'development'
    };
  }
};
