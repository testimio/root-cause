const path = require('path');

module.exports = {
  overrideWebpackConfig: ({ webpackConfig, cracoConfig, pluginOptions, context: { env, paths } }) => {
    paths.appBuild = path.resolve(__dirname, './packageToPublish');
    if (env === 'production' && process.env.library) {
      webpackConfig.entry = [path.resolve(__dirname, './src/main.ts')];
      webpackConfig.output.path = path.resolve(__dirname, './packageToPublish');
      webpackConfig.output.filename = `[name].js`;
      webpackConfig.output.libraryTarget = `commonjs2`;
      webpackConfig.externals = {
        react: 'react',
        mobx: 'mobx',
        'mobx-react-lite': 'mobx-react-lite',
        'mobx-utils': 'mobx-utils',
      };

      webpackConfig.optimization = {
        minimize: false,
        splitChunks: { chunks: 'all', name: false, minSize: Math.pow(10, 10) },
      };

      const pluginsToKeep = new Set([
        'ForkTsCheckerWebpackPlugin',
        'IgnorePlugin',
        'DefinePlugin',
        'ModuleNotFoundPlugin',
        'ManifestPlugin',
        'MiniCssExtractPlugin',
      ]);

      webpackConfig.plugins = webpackConfig.plugins.filter((p) => pluginsToKeep.has(p.constructor.name));

      const miniCssExtractPlugin = webpackConfig.plugins.find((p) => p.constructor.name === 'MiniCssExtractPlugin');
      miniCssExtractPlugin.options.filename = '[name].css';
      miniCssExtractPlugin.options.chunkFilename = undefined;
    }

    return webpackConfig;
  },
};
