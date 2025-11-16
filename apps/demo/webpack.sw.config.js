const path = require('path');

module.exports = {
  target: 'webworker',
  mode: 'production',
  entry: path.resolve(__dirname, 'src/service-worker.ts'),
  output: {
    path: path.resolve(__dirname, '.tmp'),
    filename: 'service-worker.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.sw.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  devtool: 'source-map', // Enable source maps for debugging
  stats: {
    colors: true,
    errors: true,
    warnings: true,
    errorDetails: true,
  },
};