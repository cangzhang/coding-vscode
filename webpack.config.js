const path = require('path');

module.exports = {
  entry: {
    main: './webviews/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'out/webviews'),
    filename: '[name].js',
  },
  devtool: 'eval-source-map',
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      webviews: path.resolve(__dirname, `webviews`),
      src: path.resolve(__dirname, `src`),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        options: {},
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
    ],
  },
  performance: {
    hints: false,
  },
};
