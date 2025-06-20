const path = require('path');

module.exports = {
  entry: './src/browser.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'promptframe.umd.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'PromptFrame',
      type: 'umd'
    },
    globalObject: 'this'
  },
  externals: {
    // Exclude React from the bundle - should be loaded externally
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
}; 