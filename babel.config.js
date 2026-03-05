module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: '@welldone-software/why-did-you-render',
        },
      ],
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      'babel-plugin-transform-typescript-metadata',
    ],
  };
};
